/* Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. */

import Command from '@oclif/command';
import * as yaml from 'js-yaml';
import { readFile } from './fs';

const manifestPath = 'manifest.yml';

interface Application {
  name: string;
}

interface ManifestYaml {
  applications: Application[];
}

export async function getProjectNameFromManifest(
  command: Command
): Promise<string | undefined> {
  const manifestStr = await readFile('manifest.yml', {
    encoding: 'utf8'
  }).catch(() => {
    command.log(`No '${manifestPath}' found.`);
  });
  if (manifestStr) {
    try {
      const manifest = yaml.safeLoad(manifestStr, {
        filename: 'manifest.yml',
        onWarning: () =>
          command.warn(
            `Could not read name from 'manifest.yml'. Please ensure you ran 'sap-cloud-sdk init' before calling ${command.id}.`
          )
      }) as ManifestYaml;

      if (
        typeof manifest.applications === 'undefined' ||
        !Array.isArray(manifest.applications)
      ) {
        throw new TypeError(
          'Application property missing in manifest.yml or is not an array.'
        );
      }
      if (manifest.applications.length > 1) {
        command.warn(
          'There were multiple apps in the `manifest.yml`. Project name will be retrieved from the first app.'
        );
      }
      return manifest['applications'].map((app: any) => app.name)[0];
    } catch (error) {
      command.log(`Unable to read 'manifest.yml' (${error.message}).`);
    }
  }
}
