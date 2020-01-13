/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

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

export function getTemplatePaths(inputDirs: string[], excludes: string[] = []): { [inputDir: string]: string[] } {
  return inputDirs.reduce(
    (templatePaths, inputDir) => ({
      ...templatePaths,
      [inputDir]: getTemplatePathsForDir([inputDir], excludes)
    }),
    {}
  );
}

function getCopyDescriptorForPath(targetDir: string, templateSubDir: string, templatePath: string): CopyDescriptor {
  const relativeSourcePath = path.relative(path.resolve(templatesDir, templateSubDir), path.dirname(templatePath));
  const targetTemplateDir = path.resolve(targetDir, relativeSourcePath);

  return {
    sourcePath: templatePath,
    fileName: path.resolve(targetTemplateDir, path.basename(templatePath, '.mu'))
  };
}

export function getCopyDescriptors(targetDir: string, templatePaths: { [templateSubDir: string]: string[] }): CopyDescriptor[] {
  return Object.entries(templatePaths).reduce(
    (allCopyDescriptors: CopyDescriptor[], [templateSubDir, paths]) => [
      ...allCopyDescriptors,
      ...paths.map(path => getCopyDescriptorForPath(targetDir, templateSubDir, path))
    ],
    []
  );
}

export async function findConflicts(copyDescriptors: CopyDescriptor[], force = false) {
  const conflicts = copyDescriptors.filter(copyDescriptor => fs.existsSync(copyDescriptor.fileName));

  if (conflicts.length) {
    if (force) {
      conflicts.forEach(copyDescriptor => fs.unlinkSync(copyDescriptor.fileName));
    } else {
      const listOfFiles = conflicts.map(f => path.basename(f.fileName)).join('", "');
      throw new Error(
        conflicts.length > 1
          ? `Files with the names "${listOfFiles}" already exist. If you want to overwrite them, rerun the command with \`--force\`.`
          : `A file with the name "${listOfFiles}" already exists. If you want to overwrite it, rerun the command with \`--force\`.`
      );
    }
  }
}

export async function copyFiles(copyDescriptors: CopyDescriptor[], options: { [key: string]: any }) {
  return Promise.all(
    copyDescriptors.map(({ sourcePath, fileName }) =>
      sourcePath instanceof URL ? copyRemote(sourcePath, fileName) : copyLocal(sourcePath, fileName, options)
    )
  );
}

async function copyRemote(sourcePath: URL, fileName: string) {
  return new Promise((resolve, reject) => {
    https
      // TODO The toString() cast was necessary due to a faulty overloading of the https.get method from agent-base package
      // Once the SDK version and as a consequence agent-base is updated the toString() can be removed.
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
