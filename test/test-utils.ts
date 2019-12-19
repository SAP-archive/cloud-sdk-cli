/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';

export function getPathPrefix(dir: string, file: string): string {
  return path.resolve(dir, file.replace(/\./g, '-')).replace('-ts', '');
}

export function removeDir(dir: string): void {
  if (fs.existsSync(dir)) {
    rm.sync(dir);
  }
}

export function getCleanProjectDir(pathPrefix: string, name: string): string {
  const projectDir = path.resolve(pathPrefix, name);
  removeDir(projectDir);
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}
