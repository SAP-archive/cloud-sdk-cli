/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';

export function getTestOutputDir(dir: string, file: string): string {
  return path.resolve(dir, file.replace(/\./g, '-')).replace('-ts', '');
}

export function getCleanProjectDir(pathPrefix: string, name: string): string {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    rm.sync(projectDir);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}
