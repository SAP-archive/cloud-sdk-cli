/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import cli from 'cli-ux';
import * as execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import { getJestConfig } from './jest-config';

interface PackageJsonChange {
  scripts?: { [key: string]: string };
  dependencies?: string[];
  devDependencies?: string[];
  jest?: { [key: string]: any };
}

const frontendTestScripts: PackageJsonChange = {
  scripts: {
    'ci-frontend-unit-test':
      'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/frontend-unit/` and coverage in a cobertura format to `s4hana_pipeline/reports/coverage/frontend-unit/`"',
    'ci-e2e': 'echo "Test your application and write results in a JUnit format to `s4hana_pipeline/reports/e2e/`"'
  }
};

const cdsChanges = {
  scripts: {
    'cds-build': 'cds build/all',
    'cds-deploy': 'cds deploy',
    'ci-build': 'npm run cds-deploy && npm run cds-build && npm run build'
  },
  devDependencies: ['sqlite3'],
  dependencies: ['@sap/cds', '@sap/cds-dk']
};

const scaffoldProjectPackageJson: PackageJsonChange = {
  scripts: {
    'deploy': 'npm run ci-build && npm run ci-package && cf push',
    'ci-build': 'npm run build',
    'ci-package': 'sap-cloud-sdk package',
    'ci-integration-test': 'jest --ci --config ./test/jest-e2e.json',
    'ci-backend-unit-test': 'jest --ci'
  },
  devDependencies: ['jest-junit', '@sap/cloud-sdk-test-util', '@sap-cloud-sdk/cli'],
  dependencies: ['@sap/cloud-sdk-core'],
  jest: getJestConfig(true)
};

const existingProjectPackageJson: PackageJsonChange = {
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

function findScriptConflicts(originalScripts: any, scriptsToBeAdded: any) {
  return originalScripts ? Object.keys(scriptsToBeAdded).filter(name => Object.keys(originalScripts).includes(name)) : [];
}

async function getPackageJsonChanges(isScaffold: boolean, frontendScripts: boolean, addCds: boolean) {
  const changes: PackageJsonChange[] = [isScaffold ? scaffoldProjectPackageJson : existingProjectPackageJson];
  if (frontendScripts) {
    changes.push(frontendTestScripts);
  }

  if (addCds) {
    changes.push(cdsChanges);
  }

  const merged = changes.reduce((mergedChanges, change) => {
    (Object.entries(change) as Array<[keyof PackageJsonChange, any]>).forEach(([key, value]) => {
      const newValue = { ...mergedChanges[key], ...value };
      mergedChanges[key] = Array.isArray(value) ? Object.values(newValue) : newValue;
    });

    return mergedChanges;
  }, {});

  return {
    ...merged,
    dependencies: await addDependencyVersions(merged.dependencies),
    devDependencies: await addDependencyVersions(merged.devDependencies)
  };
}

function mergePackageJson(originalPackageJson: any, changes: any) {
  const adjustedPackageJson = {
    ...originalPackageJson,
    scripts: { ...originalPackageJson.scripts, ...changes.scripts },
    dependencies: { ...changes.dependencies, ...originalPackageJson.dependencies },
    devDependencies: { ...changes.devDependencies, ...originalPackageJson.devDependencies }
  };

  if (changes.jest) {
    adjustedPackageJson.jest = { ...originalPackageJson.jest, ...changes.jest };
  }

  return adjustedPackageJson;
}

export async function modifyPackageJson({
  projectDir,
  isScaffold = false,
  frontendScripts = false,
  force = false,
  addCds = false
}: {
  projectDir: string;
  isScaffold?: boolean;
  frontendScripts?: boolean;
  force?: boolean;
  addCds?: boolean;
}) {
  const originalPackageJson = parsePackageJson(projectDir);
  const changes = await getPackageJsonChanges(isScaffold, frontendScripts, addCds);
  const conflicts = findScriptConflicts(originalPackageJson.scripts, changes.scripts);

  if (conflicts.length && !force) {
    return cli.error(
      conflicts.length > 1
        ? `Scripts with the names "${conflicts.join('", "')}" already exist. If you want to overwrite them, rerun the command with \`--force\`.`
        : `A script with the name "${conflicts.join('", "')}" already exists. If you want to overwrite it, rerun the command with \`--force\`.`,
      { exit: 12 }
    );
  }

  fs.writeFileSync(path.resolve(projectDir, 'package.json'), JSON.stringify(mergePackageJson(originalPackageJson, changes), null, 2));
}

async function addDependencyVersions(dependencies: string[] = []): Promise<{ [key: string]: string }> {
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
