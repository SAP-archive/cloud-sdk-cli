/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jest.retryTimes(3);

import * as fs from 'fs-extra';
import * as path from 'path';
import { buildScaffold } from '../../src/utils';
import { deleteAsync, getCleanProjectDir, getTestOutputDir, TimeThresholds } from '../test-utils';

const testOutputDir = getTestOutputDir(__filename);

describe('Scaffold Utils', () => {
  beforeAll(async () => {
    await deleteAsync(testOutputDir, 6);
  }, TimeThresholds.LONG);

  test(
    '[E2E] should build the scaffold',
    async () => {
      const projectDir = await getCleanProjectDir(testOutputDir, 'build-scaffold');

      await buildScaffold(projectDir, false, false);

      const files = fs.readdir(projectDir);
      const mainTs = fs.readFile(path.resolve(projectDir, 'src', 'main.ts'), { encoding: 'utf8' });
      const tsconfigBuildJson = fs.readFile(path.resolve(projectDir, 'tsconfig.build.json'), { encoding: 'utf8' });
      const tsconfigJson = fs.readFile(path.resolve(projectDir, 'tsconfig.json'), { encoding: 'utf8' });

      expect((await files).sort()).toMatchSnapshot();
      expect(await mainTs).toMatch('.listen(process.env.PORT || 3000)');
      expect(await tsconfigBuildJson).toMatch('deployment');
      expect(await tsconfigJson).toMatch('"allowJs": true');

      return fs.remove(`${testOutputDir}/build-scaffold/src/app.controller.spec.ts`);
    },
    TimeThresholds.LONG
  );
});
