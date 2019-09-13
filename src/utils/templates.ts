/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import cli from 'cli-ux';
import * as fs from 'fs';
import { compile } from 'handlebars';
import * as path from 'path';
import { CopyDescriptor } from './copy-list';

export function readTemplates(fromDirectory: string[], toDirectory: string): CopyDescriptor[] {
  const files = fs.readdirSync(path.resolve(...fromDirectory), { withFileTypes: true });
  const results: CopyDescriptor[] = [];
  return files.reduce((prev, curr) => {
    if (curr.isDirectory()) {
      prev = prev.concat(readTemplates(fromDirectory.concat(curr.name), toDirectory));
    }
    if (curr.isFile()) {
      prev.push({
        sourcePath: path.resolve(...fromDirectory, curr.name),
        targetFolder: path.resolve(toDirectory, ...fromDirectory.slice(1)),
        fileName: path.resolve(toDirectory, ...fromDirectory.slice(1), path.basename(curr.name, '.mu'))
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

export function copyFiles(files: CopyDescriptor[], options: { [key: string]: any }, stderr: stderr) {
  for (const file of files) {
    let content: string;

    if (path.extname(file.sourcePath) === '.mu') {
      const template = compile(fs.readFileSync(file.sourcePath, { encoding: 'utf8' }));
      content = template(options);
    } else {
      content = fs.readFileSync(file.sourcePath, { encoding: 'utf8' });
    }

    try {
      fs.mkdirSync(file.targetFolder, { recursive: true });
    } catch (error) {
      stderr(error.message);
    }

    fs.writeFileSync(file.fileName, content);
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
