/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import cli from 'cli-ux';
import * as fs from 'fs';
import { compile } from 'handlebars';
import * as https from 'https';
import * as path from 'path';
import { CopyDescriptor } from './copy-list';

interface TemplateParam {
  from: string[];
  to: string;
  exclude?: string[];
}

export function readTemplates({ from, to, exclude = [] }: TemplateParam): CopyDescriptor[] {
  const files = fs.readdirSync(path.resolve(...from), { withFileTypes: true });
  const results: CopyDescriptor[] = [];
  return files.reduce((prev, curr) => {
    if (curr.isDirectory() && !exclude.includes(curr.name)) {
      prev = prev.concat(readTemplates({ from: from.concat(curr.name), to, exclude }));
    }
    if (curr.isFile() && !exclude.includes(curr.name)) {
      prev.push({
        sourcePath: path.resolve(...from, curr.name),
        targetFolder: path.resolve(to, ...from.slice(1)),
        fileName: path.resolve(to, ...from.slice(1), path.basename(curr.name, '.mu'))
      });
    }
    return prev;
  }, results);
}

type stderr = (
  input: string | Error,
  options?: {
    code?: string;
    exit?: number;
  }
) => never;

export async function findConflicts(files: CopyDescriptor[], force: boolean, stderr: stderr) {
  const conflicts = files.filter(file => fs.existsSync(file.fileName));

  if (conflicts.length) {
    const overwrite =
      force ||
      (await cli.confirm(`File(s) "${conflicts.map(f => path.basename(f.fileName)).join('", "')}" already exist(s). Should they be overwritten?`));
    if (overwrite) {
      conflicts.forEach(file => fs.unlinkSync(file.fileName));
    } else {
      stderr('Script exits now as file(s) cannot be overwritten', { exit: 11 });
    }
  }
}

export async function copyFiles(files: CopyDescriptor[], options: { [key: string]: any }) {
  return Promise.all(
    files.map(file => {
      const { sourcePath, targetFolder, fileName } = file;

      if (sourcePath instanceof URL) {
        return copyRemote(sourcePath, targetFolder, fileName);
      } else {
        return copyLocal(sourcePath, targetFolder, fileName, options);
      }
    })
  );
}

function copyRemote(sourcePath: URL, targetFolder: string, fileName: string) {
  return new Promise((resolve, reject) => {
    https
      .get(sourcePath, response => {
        if (response.statusCode && (response.statusCode < 200 || response.statusCode > 299)) {
          reject(new Error('Failed to load page, status code: ' + response.statusCode));
        }

        response.on('data', content => {
          fs.mkdirSync(targetFolder, { recursive: true });
          fs.writeFileSync(fileName, content);
          resolve();
        });
      })
      .on('error', e => {
        reject(e);
      });
  });
}

function copyLocal(sourcePath: string, targetFolder: string, fileName: string, options: { [key: string]: any }) {
  try {
    let content: string;

    if (path.extname(sourcePath) === '.mu') {
      const template = compile(fs.readFileSync(sourcePath, { encoding: 'utf8' }));
      content = template(options);
    } else {
      content = fs.readFileSync(sourcePath, { encoding: 'utf8' });
    }

    fs.mkdirSync(targetFolder, { recursive: true });
    fs.writeFileSync(fileName, content);
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  }
}

export function ensureDirectoryExistence(filePath: string, isDir: boolean = false) {
  const dirname = isDir ? filePath : path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}
