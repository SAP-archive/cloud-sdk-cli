/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import cli from 'cli-ux';
import * as fs from 'fs';
import { compile } from 'handlebars';
import * as https from 'https';
import * as path from 'path';
import { CopyDescriptor } from './copy-list';

const templatesDir = path.resolve(__dirname, '../templates');

function getTemplatePathsForDir(inputDir: string[], excludes: string[]): string[] {
  const directoryEntries = fs.readdirSync(path.resolve(templatesDir, ...inputDir), { withFileTypes: true });
  return directoryEntries.reduce((templates: string[], directoryEntry) => {
    if (directoryEntry.isDirectory() && !excludes.includes(directoryEntry.name)) {
      return [...templates, ...getTemplatePathsForDir([...inputDir, directoryEntry.name], excludes)];
    }
    if (directoryEntry.isFile() && !excludes.includes(directoryEntry.name)) {
      return [...templates, path.resolve(templatesDir, ...inputDir, directoryEntry.name)];
    }
    return templates;
  }, []);
}

export function getTemplatePaths(inputDirs: string[], excludes: string[] = []): string[] {
  return inputDirs.reduce((templatePaths: string[], inputDir) => [...templatePaths, ...getTemplatePathsForDir([inputDir], excludes)], []);
}

function getRelativeSourcePath(templatePath: string): string {
  return path
    .relative(templatesDir, path.dirname(templatePath))
    .split(path.sep)
    .slice(1)
    .join(path.sep);
}

export function getCopyDescriptorsForTemplates(targetDir: string, templatePaths: string[]): CopyDescriptor[] {
  return templatePaths.map(templatePath => {
    const relativeSourcePath = getRelativeSourcePath(templatePath);
    const targetTemplateDir = path.resolve(targetDir, relativeSourcePath);
    return {
      sourcePath: templatePath,
      fileName: path.resolve(targetTemplateDir, path.basename(templatePath, '.mu'))
    };
  });
}

export async function findConflicts(files: CopyDescriptor[], force = false) {
  const conflicts = files.filter(file => fs.existsSync(file.fileName));

  if (conflicts.length) {
    if (force) {
      conflicts.forEach(file => fs.unlinkSync(file.fileName));
    } else {
      const listOfFiles = conflicts.map(f => path.basename(f.fileName)).join('", "');
      cli.error(
        conflicts.length > 1
          ? `Files with the names "${listOfFiles}" already exist. If you want to overwrite them, rerun the command with \`--force\`.`
          : `A file with the name "${listOfFiles}" already exists. If you want to overwrite it, rerun the command with \`--force\`.`,
        { exit: 1 }
      );
    }
  }
}

export async function copyFiles(files: CopyDescriptor[], options: { [key: string]: any }) {
  return Promise.all(
    files.map(file => {
      const { sourcePath, fileName } = file;

      if (sourcePath instanceof URL) {
        return copyRemote(sourcePath, fileName);
      }
      return copyLocal(sourcePath, fileName, options);
    })
  );
}

async function copyRemote(sourcePath: URL, fileName: string) {
  return new Promise((resolve, reject) => {
    https
      .get(sourcePath, response => {
        if (response.statusCode && (response.statusCode < 200 || response.statusCode > 299)) {
          reject(new Error('Failed to load page, status code: ' + response.statusCode));
        }

        response.on('data', content => {
          fs.mkdirSync(path.dirname(fileName), { recursive: true });
          fs.writeFileSync(fileName, content);
          resolve();
        });
      })
      .on('error', e => {
        reject(e);
      });
  });
}

async function copyLocal(sourcePath: string, fileName: string, options: { [key: string]: any }) {
  fs.mkdirSync(path.dirname(fileName), { recursive: true });

  if (path.extname(sourcePath) === '.mu') {
    const template = compile(fs.readFileSync(sourcePath, { encoding: 'utf8' }));
    fs.writeFileSync(fileName, template(options));
  } else {
    fs.copyFileSync(sourcePath, fileName);
  }
}

export function ensureDirectiryExists(filePath: string, isDir: boolean = false) {
  const dirname = isDir ? filePath : path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    fs.mkdirSync(dirname, { recursive: true });
  }
}
