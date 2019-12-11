/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import cli from 'cli-ux';
import * as fs from 'fs';
import * as path from 'path';

export function modifyGitIgnore(projectDir: string) {
  const pathToGitignore = path.resolve(projectDir, '.gitignore');
  const pathsToIgnore = ['credentials.json', '/s4hana_pipeline', '/deployment'];

  if (fs.existsSync(pathToGitignore)) {
    try {
      const fileContent = fs.readFileSync(pathToGitignore, 'utf8');
      const newPaths = pathsToIgnore.filter(path => !fileContent.includes(path));
      const newFileContent = fileContent + (newPaths.length ? `\n${newPaths.join('\n')}\n` : '');

      fs.writeFileSync(pathToGitignore, newFileContent, 'utf8');
    } catch (error) {
      cli.warn('There was a problem writing to the .gitignore.');
      cli.log('If your project is using a different version control system, please make sure the following paths are not tracked:');
      pathsToIgnore.forEach(path => cli.log('  ' + path));
    }
  } else {
    cli.warn('No .gitignore file found!');
    cli.log('If your project is using a different version control system, please make sure the following paths are not tracked:');
    pathsToIgnore.forEach(path => cli.log('  ' + path));
  }
}
