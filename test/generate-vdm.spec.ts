/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import { GeneratorOptions as GeneratorOptionsSDK, generatorOptionsCli as generatorOptionsSDK } from '@sap/cloud-sdk-generator';
import * as fs from 'fs-extra';
import * as path from 'path';
import GenerateVdm from '../src/commands/generate-vdm';
import * as generateVdmUtil from '../src/utils/generate-vdm-util';

const spyToGeneratorSDK = jest.spyOn(generateVdmUtil, 'toGeneratorSDK');

describe('generate-vdm', () => {
  const pathForTests = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

  beforeAll(() => {
    const pathForResources = path.resolve(__dirname, 'resources', 'template-generator-vdm');
    fs.copySync(pathForResources, pathForTests);
  });

  afterAll(() => {
    fs.removeSync(pathForTests);
  });

  it('should fail if the mandatory parameters are not there', async () => {
    try {
      await GenerateVdm.run([]);
    } catch (e) {
      expect(e.message).toContain('-i, --inputDir INPUTDIR');
    }
  });

  it('should parse strings and with --no- it should lead to all false.', async () => {
    const expected = getParsedInputWithAllBooleanFlagsFalse();
    delete expected.projectDir;
    try {
      await GenerateVdm.run([...getCliInputWithAllBooleanFlagsFalse(), '--projectDir', getProjectDir()]);
    } catch (e) {
      expect(e.message).toContain('ENOENT: no such file or directory');
      expect(spyToGeneratorSDK).toHaveReturnedWith(expected);
    }
  });

  it('should resolve the projectdir', async () => {
    // TODO there was a issue in the SDK for the service-mapping.json file and windows. Onve the fix is out put this test back int.
    if (process.platform !== 'win32') {
      const expected = getDefault(getProjectDir());

      try {
        await GenerateVdm.run(['-i', 'input', '-o', 'output', '--projectDir', getProjectDir()]);
      } catch (e) {
        expect(e.message).toContain('ENOENT: no such file or directory');
        expect(spyToGeneratorSDK).toHaveReturnedWith(expected);
      }
    }
  });

  function getProjectDir() {
    return path.resolve(__dirname, 'generate-vdm-spec');
  }

  function getInputAndExpected(key: keyof GeneratorOptionsSDK): { expected: GeneratorOptionsSDK; args: string[] } | undefined {
    const args = ['-i', 'input', '-o', 'output', '--projectDir', getProjectDir()];
    const expected = getDefault(getProjectDir());

    const option = generatorOptionsSDK[key];
    if (option && option.type === 'boolean') {
      const casted = key as keyof GeneratorOptionsSDK;
      args.push(`--${option.default ? 'no-' : ''}${key}`);
      (expected[casted] as boolean) = !option.default;
      return { args, expected };
    }
  }

  it('should pass each boolean flags correctly', async () => {
    // TODO there was a issue in the SDK for the service-mapping.json file and windows. Onve the fix is out put this test back int.
    if (process.platform !== 'win32') {
      for (const key of Object.keys(generatorOptionsSDK)) {
        const argsExpected = getInputAndExpected(key as keyof GeneratorOptionsSDK);
        if (argsExpected) {
          try {
            await GenerateVdm.run(argsExpected.args);
          } catch (e) {
            expect(e.message).toContain('ENOENT: no such file or directory');
            expect(spyToGeneratorSDK).toHaveReturnedWith(argsExpected.expected);
          }
        }
      }
    }
  }, 10000);

  function getDefault(projectDir: string): GeneratorOptionsSDK {
    return {
      ...Object.keys(generatorOptionsSDK).reduce((prev, current) => {
        const value = generatorOptionsSDK[current as keyof GeneratorOptionsSDK];
        return value ? { ...prev, [current]: value.default } : prev;
      }, {} as any),
      inputDir: path.resolve(projectDir, 'input'),
      outputDir: path.resolve(projectDir, 'output'),
      serviceMapping: path.resolve(projectDir, 'input', 'service-mapping.json')
    };
  }

  function getCliInputWithAllBooleanFlagsFalse(): string[] {
    const allFalse = getParsedInputWithAllBooleanFlagsFalse();
    return Object.entries(allFalse).reduce((collected: string[], [key, value]) => {
      switch (typeof allFalse[key as keyof generateVdmUtil.FlagsParsed]) {
        case 'string':
          return [...collected, `--${key}`, value!.toString()];
        case 'boolean':
        default:
          return generatorOptionsSDK[key as keyof GeneratorOptionsSDK]?.default ? [...collected, `--no-${key}`] : collected;
      }
    }, []);
  }

  function getParsedInputWithAllBooleanFlagsFalse(): generateVdmUtil.FlagsParsed {
    return {
      aggregatorNpmPackageName: 'aggregatorNpm',
      aggregatorDirectoryName: 'aggregationDirectory',
      changelogFile: path.resolve(getProjectDir(), 'ChangeLogFile'),
      inputDir: path.resolve(getProjectDir(), 'InputDir'),
      outputDir: path.resolve(getProjectDir(), 'OutputDir'),
      projectDir: getProjectDir(),
      serviceMapping: path.resolve(getProjectDir(), 'ServiceMapping'),
      generateNpmrc: false,
      clearOutputDir: false,
      s4hanaCloud: false,
      sdkAfterVersionScript: false,
      writeReadme: false,
      useSwagger: false,
      generatePackageJson: false,
      generateTypedocJson: false,
      generateJs: false,
      generateCSN: false,
      forceOverwrite: false
    };
  }
});
