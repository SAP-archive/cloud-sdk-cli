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

const scaffoldPackageJsonParts = {
  scripts: {
    'deploy': 'npm run ci-build && npm run ci-package && cf push',
    'ci-build': 'npm run build',
    'ci-package': 'sap-cloud-sdk package',
    'ci-integration-test': 'jest --ci --config ./test/jest-e2e.json',
    'ci-backend-unit-test': 'jest --ci --coverage'
  },
  devDependencies: ['jest', 'jest-junit', '@sap/cloud-sdk-test-util'],
  dependencies: ['@sap/cloud-sdk-core']
};

const userDefinedJsonParts = {
  scripts: {
    'ci-build': 'echo "Use this to compile or minify your application"',
    'ci-package': 'echo "Copy all deployment-relevant files to the `deployment` folder"',
    'ci-integration-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-integration/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-integration/`"',
    'ci-backend-unit-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/backend-unit/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/backend-unit/`"'
  },
  devDependencies: ['@sap/cloud-sdk-test-util'],
  dependencies: ['@sap/cloud-sdk-core']
};

export function parsePackageJson(projectDir: string) {
  if (fs.existsSync(path.resolve(projectDir, 'package.json'))) {
    return JSON.parse(
      fs.readFileSync(path.resolve(projectDir, 'package.json'), {
        encoding: 'utf8'
      })
    );
  }
}

export async function modifyPackageJson(projectDir: string, addFrontendScripts: boolean, buildScaffold: boolean) {
  const packageJsonData = buildScaffold ? scaffoldPackageJsonParts : userDefinedJsonParts;
  const originalPackageJson = parsePackageJson(projectDir);
  const { scripts, dependencies, devDependencies } = originalPackageJson;
  const scriptsToBeAdded = addFrontendScripts ? { ...packageJsonData.scripts, ...frontendScripts } : packageJsonData.scripts;

  const conflicts = scripts ? Object.keys(scriptsToBeAdded).filter(name => Object.keys(scripts).includes(name)) : [];

  cli.error(
    conflicts.length > 1
      ? `Scripts with the names "${conflicts.join('", "')}" already exist. Please rerun the command with \`--force\`.`
      : `A script with the name "${conflicts.join('", "')}" already exists. Please rerun the command with \`--force\`.`,
    { exit: 12 }
  );

  const adjustedPackageJson = {
    ...originalPackageJson,
    scripts: { ...scripts, ...scriptsToBeAdded },
    dependencies: { ...dependencies, ...(await addDependencies(packageJsonData.dependencies)) },
    devDependencies: { ...devDependencies, ...(await addDependencies(packageJsonData.devDependencies)) }
  };
  fs.writeFileSync(path.resolve(projectDir, 'package.json'), JSON.stringify(adjustedPackageJson, null, 2));
}

async function addDependencies(dependencies: string[]): Promise<{ [key: string]: string }> {
  const versions = await Promise.all(dependencies.map(dependency => getVersionOfDependency(dependency)));
  return dependencies.reduce((result, dependency, index) => ({ ...result, [dependency]: versions[index] }), {} as any);
}

async function getVersionOfDependency(dependency: string): Promise<string> {
  try {
    const defaultOptions = ['view', dependency, 'version'];
    const version = dependency.includes('@sap')
      ? execa('npm', [...defaultOptions, '--registry', 'https://npm.sap.com'])
      : execa('npm', defaultOptions);

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
