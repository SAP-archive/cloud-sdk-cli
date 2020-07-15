/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import Command from '@oclif/command';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

const manifestPath = 'manifest.yml';

export function getProjectNameFromManifest(command: Command): string | undefined {
  if (!fs.existsSync(manifestPath)) {
    command.log(`No '${manifestPath}' found.`);
    return;
  }
  try {
    const manifestStr = fs.readFileSync('manifest.yml', { encoding: 'utf8' });
    const manifest = yaml.safeLoad(manifestStr, {
      filename: 'manifest.yml',
      onWarning: () =>
        command.warn(`Could not read name from 'manifest.yml'. Please ensure you ran 'sap-cloud-sdk init' before calling ${command.id}.`)
    });

    if(typeof manifest !== 'object'){
      throw new Error('Yaml file not an object');
    }
    if (manifest['applications'].length > 1) {
      command.warn('There were multiple apps in the `manifest.yml`. Project name will be retrieved from the first app.');
    }
    return manifest['applications'].map((app: any) => app.name)[0];
  } catch (error) {
    command.log(`Unable to read 'manifest.yml' (${error.message}).`);
  }
}
