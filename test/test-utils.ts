/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

import * as path from 'path';
import { access, mkdir, rm } from '../src/utils';
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

  try {
    await access(projectDir);
    await rm(projectDir);
  } catch {}

  await mkdir(projectDir, { recursive: true });
  return projectDir;
}

export enum TimeThresholds {
  EXTRA_SHORT = 10000,
  SHORT = 45000,
  MEDIUM = 90000,
  LONG = 240000,
  EXTRA_LONG = 480000
}
