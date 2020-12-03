/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

import * as path from 'path';
import cli from 'cli-ux';
import * as execa from 'execa';
import {
  recordWarning,
  access,
  readdir,
  rm,
  readFile,
  writeFile
} from '../utils';

export async function shouldBuildScaffold(
  projectDir: string,
  doBuildScaffold: boolean,
  force = false
): Promise<boolean> {
  if (doBuildScaffold) {
    await checkForEmptyDir(projectDir, force);
    return true;
  }

  try {
    await access(path.resolve(projectDir, 'package.json'));
    return false;
  } catch {
    cli.log(
      `The target directory (${projectDir}) does not contain a \`package.json.\``
    );

    if (
      await cli.confirm(
        'Should a new `nest.js` project be initialized in the target directory? (y|n)'
      )
    ) {
      await checkForEmptyDir(projectDir, force);
      return true;
    }
    cli.info(
      '➡️ Cancelling `init` because a valid `package.json` is required to run.'
    );
    return cli.exit(13);
  }
}

async function checkForEmptyDir(projectDir: string, force: boolean) {
  if ((await readdir(projectDir)).length !== 0) {
    const dirString = projectDir === '.' ? 'this directory' : `"${projectDir}"`;
    const question = `Directory is not empty. Creating the scaffold will fail if there are conflicting files. Should ALL files in ${dirString} be removed? (y|n)`;
    if (force || (await cli.confirm(question))) {
      await rm(`${projectDir}/{*,.*}`);
    }
  }
}

export async function buildScaffold(
  projectDir: string,
  verbose: boolean,
  addCds: boolean
): Promise<void> {
  cli.action.start('Building application scaffold');
  const options: execa.Options = {
    cwd: projectDir,
    stdio: verbose ? 'inherit' : 'ignore'
  };

  await execa(
    'npx',
    [
      '-p',
      '@nestjs/cli',
      'nest',
      'new',
      '.',
      '--skip-install',
      '--package-manager',
      'npm'
    ],
    options
  );

  await rm(path.resolve(projectDir, 'README.md'));
  await modifyMainTs(path.resolve(projectDir, 'src', 'main.ts'));
  await modifyTsconfigBuildJson(
    path.resolve(projectDir, 'tsconfig.build.json')
  );
  modifyTsconfigJson(path.resolve(projectDir, 'tsconfig.json'));
  if (addCds) {
    await addCatalogueModule(path.resolve(projectDir, 'src', 'app.module.ts'));
  }
  cli.action.stop();
}

async function modifyMainTs(pathToMainTs: string) {
  const mainTs = await readFile(pathToMainTs, { encoding: 'utf8' });
  const modifiedListen = '.listen(process.env.PORT || 3000)';
  const modifiedMainTs = mainTs.replace('.listen(3000)', modifiedListen);

  if (modifiedMainTs.includes(modifiedListen)) {
    try {
      await writeFile(pathToMainTs, modifiedMainTs);
    } catch (err) {
      recordWarning(
        'Could not set listening port to `process.env.PORT`',
        'in file `app.module.ts`. Please adjust manually.'
      );
    }
  } else {
    recordWarning(
      'Could not set listening port to `process.env.PORT`',
      'in file `app.module.ts`. Please adjust manually.'
    );
  }
}

async function modifyTsconfigBuildJson(pathToTsconfigBuildJson: string) {
  const tsconfigBuildJson = await readFile(pathToTsconfigBuildJson, {
    encoding: 'utf8'
  });
  const jsonObj = JSON.parse(tsconfigBuildJson);
  if (jsonObj.exclude) {
    jsonObj.exclude = [...jsonObj.exclude, 'deployment'];
  }
  try {
    await writeFile(pathToTsconfigBuildJson, JSON.stringify(jsonObj, null, 2));
  } catch (err) {
    recordWarning(
      'Could not exclude deployment`',
      'in file `tsconfig.build.json`. Please adjust manually.'
    );
  }
}

async function modifyTsconfigJson(pathToTsconfigJson: string) {
  const tsconfigJson = await readFile(pathToTsconfigJson, {
    encoding: 'utf8'
  });
  const jsonObj = JSON.parse(tsconfigJson);
  if (jsonObj.compilerOptions) {
    jsonObj.compilerOptions = { ...jsonObj.compilerOptions, allowJs: true };
  }
  try {
    await writeFile(pathToTsconfigJson, JSON.stringify(jsonObj, null, 2));
  } catch (err) {
    recordWarning(
      'Could not add compiler option "allowJs": true`',
      'in file `tsconfig.json`. Please adjust manually.'
    );
  }
}

async function addCatalogueModule(pathToAppModuleTs: string): Promise<void> {
  const appModuleTs = await readFile(pathToAppModuleTs, { encoding: 'utf8' });
  const moduleName = 'CatalogueModule';
  const importToAdd = `import { ${moduleName} } from './catalogue/catalogue.module';`;
  const modifiedAppModuleTs = appModuleTs
    .replace('@Module', [importToAdd, '@Module'].join('\n\n'))
    .replace('imports: []', `imports: [${moduleName}]`);

  if (modifiedAppModuleTs.includes(`imports: [${moduleName}]`)) {
    await writeFile(pathToAppModuleTs, modifiedAppModuleTs);
  } else {
    recordWarning(
      `Could not add module ${moduleName} to \`app.module.ts\`. Please add manually.`
    );
  }
}
