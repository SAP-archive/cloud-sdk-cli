/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import cli from 'cli-ux';
import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import * as rm from 'rimraf';

export async function shouldBuildScaffold(projectDir: string, { buildScaffold, force }: any): Promise<boolean> {
  if (buildScaffold) {
    return true;
  }

  if (fs.existsSync(path.resolve(projectDir, 'package.json'))) {
    return false;
  }

  cli.log('This folder does not contain a `package.json`.');

  if (await cli.confirm('Should a new `nest.js` project be initialized in this folder?')) {
    if (fs.readdirSync(projectDir).length !== 0) {
      const dirString = projectDir === '.' ? 'this directory' : projectDir;
      if (force || (await cli.confirm(`Directory is not empty. Should all files in ${dirString} be removed?`))) {
        rm.sync(`${projectDir}/{*,.*}`);
      }
    }
    return true;
  }
  cli.info('➡️ Cancelling `init` because a valid `package.json` is required to run.');
  return cli.exit(1);
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
