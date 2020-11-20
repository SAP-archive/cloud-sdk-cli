/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';
import { ErrnoException } from 'fast-glob/out/types';
import { testDir, testOutputRootDir } from './test-output';

export function getTestOutputDir(file: string): string {
  const relativeDirPath = path.relative(testDir, path.dirname(file));
  const outputDirName = path.basename(file, '.ts').split('.').join('-');

  return path.resolve(testOutputRootDir, relativeDirPath, outputDirName);
}

export async function getCleanProjectDir(
  pathPrefix: string,
  name: string
): Promise<string> {
  const projectDir = path.resolve(pathPrefix, name);
  if (fs.existsSync(projectDir)) {
    await deleteAsync(projectDir, 3);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

export async function deleteAsync(
  dirPath: string,
  busyRetries: number
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    rm(dirPath, { maxBusyTries: busyRetries }, err =>
      callBack(err, resolve, reject)
    );
  });

  function callBack(
    err: Error | ErrnoException | null,
    resolve: () => void,
    reject: (reason: any) => void
  ) {
    if (err) {
      reject(`Error in deleting: ${path} with ${err.message}`);
    } else {
      resolve();
    }
  }
}

export enum TimeThresholds {
  EXTRA_SHORT = 10000,
  SHORT = 45000,
  MEDIUM = 90000,
  LONG = 240000,
  EXTRA_LONG = 480000
}
