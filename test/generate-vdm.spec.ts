/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
const confirm = jest.fn().mockResolvedValue(true);
jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      confirm
    }
  };
});

const warn = jest.fn(message => console.log('MOCKED WARNING: ', message));
jest.mock('@oclif/command', () => {
  const command = jest.requireActual('@oclif/command');
  command.Command.prototype.warn = warn;
  return command;
});

import { GeneratorOptions as GeneratorOptionsSDK, generatorOptionsCli as generatorOptionsSDK } from '@sap/cloud-sdk-generator';
import * as fs from 'fs-extra';
import * as path from 'path';
import GenerateVdm, { FlagsParsed } from '../src/commands/generate-vdm';
import * as foo from '../src/utils/generate-vdm-util';

const spyToGeneratorSDK = jest.spyOn(foo, 'toGeneratorSDK');

describe('generate-vdm', () => {
  const pathForTests = path.resolve(__dirname, __filename.replace(/\./g, '-')).replace('-ts', '');

  beforeAll(() => {
    const pathForResources = path.resolve(__dirname, 'resources', 'template-generator-vdm');
    fs.copySync(pathForResources, pathForTests);
    spyToGeneratorSDK.mockClear();
  });

  afterAll(() => {
    fs.removeSync(pathForTests);
    spyToGeneratorSDK.mockClear();
  });

  afterEach(()=>{
    spyToGeneratorSDK.mockClear();
  })

  beforeEach(() => {
    spyToGeneratorSDK.mockClear();
  });

  it('should generate a vdm.', async () => {
    await GenerateVdm.run(['-i', 'edmxSource', '-o', 'generatedVdm', '--forceOverwrite', '--projectDir', pathForTests]);
    const files = fs.readdirSync(path.join(pathForTests, 'generatedVdm', 'business-partner-service'));
    expect(files.length).toBeGreaterThan(0);
  }, 60000);

  it('should fail if the mandatory parameters are not there', async () => {
    try {
      await GenerateVdm.run([]);
    } catch (err) {
      const messageNoFormatting = err.message as string;
      expect(messageNoFormatting).toContain('-i, --inputDir INPUTDIR');
    }
  });

  it('should parse strings and with --no- it should lead to all false.', async () => {
    const expected = getAllFalse();
    delete expected.projectDir;
    try {
      await GenerateVdm.run([...getInputAllFalse()]);
    } catch (e) {
      expect(spyToGeneratorSDK).toHaveReturnedWith(expected);
    }
  });

  it('should resolve the projectdir', async () => {
    const projectDir = '/root';
    const expected = getDefault(projectDir);

    try {
      await GenerateVdm.run(['-i', 'input', '-o', 'output', '--projectDir', projectDir]);
    } catch (e) {
      expect(spyToGeneratorSDK).toHaveReturnedWith(expected);
    }
  });

  it('should pass each boolean flags correctly', async () => {
    return Object.keys(generatorOptionsSDK).map(async key => {
      const option = generatorOptionsSDK[key as keyof GeneratorOptionsSDK];
      const expected = getDefault('root');
      const args = ['-i', '/input', '-o', '/output', '--projectDir', '/'];

      if (option !== undefined && option.type === 'boolean') {
        const casted = key as keyof GeneratorOptionsSDK;
        if (!option.default) {
          args.push(`--${key}`);
          (expected[casted] as any) = true;
        } else {
          args.push(`--no-${key}`);
          (expected[casted] as any) = false;
        }
        try {
          await GenerateVdm.run(args);
        } catch (e) {
          expect(spyToGeneratorSDK).toHaveReturnedWith(expected);
        }
      }
    });
  });

  function getInputAllFalse(): string[] {
    const allFalse = getAllFalse();
    const stringArguments = Object.keys(allFalse).reduce((collected: string[], current: string) => {
      if (typeof allFalse[current as keyof FlagsParsed] === 'string') {
        collected.push(`--${current}`, allFalse[current as keyof FlagsParsed] as string);
      }
      if (typeof allFalse[current as keyof FlagsParsed] === 'boolean') {
        const option = generatorOptionsSDK[current as keyof GeneratorOptionsSDK];
        if (option !== undefined && option.default === true) {
          collected.push(`--no-${current}`);
        }
      }
      return collected;
    }, []);
    return stringArguments;
  }

  function getDefault(root: string): GeneratorOptionsSDK {
    const options = Object.keys(generatorOptionsSDK).reduce(
      (prev, current) => {
        const value = generatorOptionsSDK[current as keyof GeneratorOptionsSDK];
        if (value !== undefined) {
          prev[current as keyof GeneratorOptionsSDK] = value.default;
        }
        return prev;
      },
      {} as any
    ) as GeneratorOptionsSDK;
    options.inputDir = path.resolve(root, 'input');
    options.outputDir = path.resolve(root, 'output');
    options.serviceMapping = path.resolve(root, 'input', 'service-mapping.json');
    return options;
  }

  function getAllFalse(): FlagsParsed {
    return {
      generateNpmrc: false,
      clearOutputDir: false,
      s4hanaCloud: false,
      sdkAfterVersionScript: false,
      serviceMapping: '/ServiceMapping',
      writeReadme: false,
      useSwagger: false,
      outputDir: '/Outdir',
      inputDir: '/InputDir',
      projectDir: '/',
      aggregatorNpmPackageName: 'aggregatorNpm',
      aggregatorDirectoryName: 'aggregationDirectory',
      generatePackageJson: false,
      generateTypedocJson: false,
      changelogFile: '/ChangeLogFile',
      generateJs: false,
      generateCSN: false,
      forceOverwrite: false
    };
  }
});
