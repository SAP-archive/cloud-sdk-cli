/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import cli from 'cli-ux';
import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';

const frontendScripts = {
  'ci-frontend-unit-test':
    'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/frontend-unit/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/frontend-unit/`"',
  'ci-e2e': 'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/e2e/`"'
};

const scaffoldProjectPackageJson = {
  scripts: {
    'deploy': 'npm run ci-build && npm run ci-package && cf push',
    'ci-build': 'npm run build',
    'ci-package': 'sap-cloud-sdk package',
    'ci-integration-test': 'jest --ci --config ./test/jest-e2e.json',
    'ci-backend-unit-test': 'jest --ci --coverage'
  },
  devDependencies: ['jest', 'jest-junit', '@sap/cloud-sdk-test-util', '@sap-cloud-sdk/cli'],
  dependencies: ['@sap/cloud-sdk-core']
};

const existingProjectPackageJson = {
  scripts: {
    'ci-build': 'echo "Use this to compile or minify your application"',
    'ci-package': 'sap-cloud-sdk package --include="package.json,package-lock.json,index.js,dist/**/*"',
    'ci-integration-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-integration/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-integration/`"',
    'ci-backend-unit-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-unit/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-unit/`"'
  },
  devDependencies: ['@sap/cloud-sdk-test-util', '@sap-cloud-sdk/cli'],
  dependencies: ['@sap/cloud-sdk-core']
};

export function parsePackageJson(projectDir: string) {
  try {
    return JSON.parse(
      fs.readFileSync(path.resolve(projectDir, 'package.json'), {
        encoding: 'utf8'
      })
    );
  } catch (error) {
    return cli.error('Your package.json does not contain valid JSON. Please repair or delete it.', { exit: 10 });
  }
}

export async function modifyPackageJson(projectDir: string, isScaffold: boolean, addFrontendScripts: boolean, force: boolean = false) {
  const packageJson = isScaffold ? scaffoldProjectPackageJson : existingProjectPackageJson;
  const originalPackageJson = parsePackageJson(projectDir);
  const { scripts, dependencies, devDependencies } = originalPackageJson;
  const scriptsToBeAdded = addFrontendScripts ? { ...packageJson.scripts, ...frontendScripts } : packageJson.scripts;

  const conflicts = scripts ? Object.keys(scriptsToBeAdded).filter(name => Object.keys(scripts).includes(name)) : [];

  if (conflicts.length && !force) {
    return cli.error(
      conflicts.length > 1
        ? `Scripts with the names "${conflicts.join('", "')}" already exist. If you want to overwrite them, rerun the command with \`--force\`.`
        : `A script with the name "${conflicts.join('", "')}" already exists. If you want to overwrite it, rerun the command with \`--force\`.`,
      { exit: 12 }
    );
  }

  const adjustedPackageJson = {
    ...originalPackageJson,
    scripts: { ...scripts, ...scriptsToBeAdded },
    dependencies: { ...(await addDependencies(packageJson.dependencies)), ...dependencies },
    devDependencies: { ...(await addDependencies(packageJson.devDependencies)), ...devDependencies }
  };
  fs.writeFileSync(path.resolve(projectDir, 'package.json'), JSON.stringify(adjustedPackageJson, null, 2));
}

async function addDependencies(dependencies: string[]): Promise<{ [key: string]: string }> {
  const versions = await Promise.all(dependencies.map(dependency => getVersionOfDependency(dependency)));
  return dependencies.reduce((result, dependency, index) => ({ ...result, [dependency]: versions[index] }), {} as any);
}

async function getVersionOfDependency(dependency: string): Promise<string> {
  try {
    const args = ['view', dependency, 'version'];
    const version = dependency.includes('@sap') ? execa('npm', [...args, '--registry', 'https://npm.sap.com']) : execa('npm', args);

    return `^${(await version).stdout}`;
  } catch (err) {
    cli.warn(`Error in finding version for dependency ${dependency} - use LATEST as fallback.`);
    return 'latest';
  }
}

export async function installDependencies(projectDir: string, verbose: boolean) {
  return execa('npm', ['install'], {
    cwd: projectDir,
    stdio: verbose ? 'inherit' : 'ignore'
  });
}
