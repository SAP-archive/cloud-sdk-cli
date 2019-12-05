/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import cli from 'cli-ux';
import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';

export async function shouldBuildScaffold(projectDir: string, buildScaffold: boolean, force: boolean = false): Promise<boolean> {
  if (buildScaffold) {
    await checkForEmptyDir(projectDir, force);
    return true;
  }

  if (fs.existsSync(path.resolve(projectDir, 'package.json'))) {
    return false;
  }

  cli.log('This folder does not contain a `package.json`.');

  if (await cli.confirm('Should a new `nest.js` project be initialized in this folder?')) {
    await checkForEmptyDir(projectDir, force);
    return true;
  }
  cli.info('➡️ Cancelling `init` because a valid `package.json` is required to run.');
  return cli.exit(13);
}

async function checkForEmptyDir(projectDir: string, force: boolean) {
  if (fs.readdirSync(projectDir).length !== 0) {
    const dirString = projectDir === '.' ? 'this directory' : `"${projectDir}"`;
    const question = `Directory is not empty. Creating the scaffold will fail if there are conflicting files. Should ALL files in ${dirString} be removed?`;
    if (force || (await cli.confirm(question))) {
      rm.sync(`${projectDir}/{*,.*}`);
    }
  }
}

export async function buildScaffold(projectDir: string, verbose: boolean) {
  cli.action.start('Building application scaffold');
  const cliPath = path.resolve('node_modules/.bin/nest');
  const options: execa.Options = {
    cwd: projectDir,
    stdio: verbose ? 'inherit' : 'ignore'
  };

  if (fs.existsSync(cliPath)) {
    await execa(cliPath, ['new', '.', '--skip-install', '--package-manager', 'npm'], options);
  } else {
    await execa('npx', ['@nestjs/cli', 'new', '.', '--skip-install', '--package-manager', 'npm'], options);
  }

  const pathToMainTs = path.resolve(projectDir, 'src', 'main.ts');
  const mainTs = fs.readFileSync(pathToMainTs, { encoding: 'utf8' });
  const modifiedMainTs = mainTs.replace('.listen(3000)', '.listen(process.env.PORT || 3000)');

  if (mainTs === modifiedMainTs) {
    cli.warn('Could not adjust listening port to `process.env.PORT`. Please adjust manually.');
  }

  fs.writeFileSync(pathToMainTs, modifiedMainTs);
  cli.action.stop();
}
