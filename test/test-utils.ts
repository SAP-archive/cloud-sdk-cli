/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { testDir, testOutputRootDir } from './test-output';

export function getTestOutputDir(file: string): string {
  const relativeDirPath = path.relative(testDir, path.dirname(file));
  const outputDirName = path
    .basename(file, '.ts')
    .split('.')
    .join('-');

  return path.resolve(testOutputRootDir, relativeDirPath, outputDirName);
}

export function getCleanProjectDir(pathPrefix: string, name: string): string {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    rm.sync(projectDir);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

export async function deleteAsync(path:string,busyRetries:number):Promise<string>{
  return new Promise<string>((resolve,reject)=>{
    rm(path, { maxBusyTries: busyRetries }, err => {
      if (err) {
        reject(`Error in deleting: ${path} with ${err.message}`)
      }else {
        resolve(`Deletion of ${path} finished.`)
      }
    });
  })
}
