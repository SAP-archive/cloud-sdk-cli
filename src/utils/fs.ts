/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

import { promisify } from 'util';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

export const access = promisify(fs.access);
export const mkdir = promisify(fs.mkdir);
export const readdir = promisify(fs.readdir);
export const readFile = promisify(fs.readFile);
export const copyFile = promisify(fs.copyFile);
export const writeFile = promisify(fs.writeFile);
export const rm = promisify(rimraf);
