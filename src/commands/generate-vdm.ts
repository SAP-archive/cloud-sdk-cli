/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { Command } from '@oclif/command';
import { generate, generatorOptionsCli as generatorOptionsSDK } from '@sap/cloud-sdk-generator';
import { BoolArgType, generatorOptionCli, StringArgType, toBooleanFlag, toGeneratorSDK, toStringFlag } from '../utils/generate-vdm-util';

export default class GenerateVdm extends Command {
  static description =
    'Generates a virtual data model (VDM) from a edmx service file definition. For SAP solutions, you can find these definitions at https://api.sap.com/.';

  static examples = [
    '$ sap-cloud-sdk generate-vdm -i directoryWithEdmxFiles -o outputDirectory --forceOverwrite',
    '$ sap-cloud-sdk generate-vdm --help'
  ];

  static flags: BoolArgType & StringArgType = {
    // Options which are 1:1 to the SDK CLI
    inputDir: toStringFlag(generatorOptionsSDK.inputDir),
    outputDir: toStringFlag(generatorOptionsSDK.outputDir),
    generateCSN: toBooleanFlag(generatorOptionsSDK.generateCSN),
    generateJs: toBooleanFlag(generatorOptionsSDK.generateJs),
    generatePackageJson: toBooleanFlag(generatorOptionsSDK.generatePackageJson),
    generateTypedocJson: toBooleanFlag(generatorOptionsSDK.generateTypedocJson),
    generateNpmrc: toBooleanFlag(generatorOptionsSDK.generateNpmrc),
    useSwagger: toBooleanFlag(generatorOptionsSDK.useSwagger),
    serviceMapping: toStringFlag(generatorOptionsSDK.serviceMapping!),
    writeReadme: toBooleanFlag(generatorOptionsSDK.writeReadme),
    changelogFile: toStringFlag(generatorOptionsSDK.changelogFile!),
    clearOutputDir: toBooleanFlag(generatorOptionsSDK.clearOutputDir),
    aggregatorDirectoryName: toStringFlag(generatorOptionsSDK.aggregatorDirectoryName!),
    aggregatorNpmPackageName: toStringFlag(generatorOptionsSDK.aggregatorNpmPackageName!),
    sdkAfterVersionScript: toBooleanFlag(generatorOptionsSDK.sdkAfterVersionScript),
    s4hanaCloud: toBooleanFlag(generatorOptionsSDK.s4hanaCloud),
    forceOverwrite: toBooleanFlag(generatorOptionsSDK.forceOverwrite),
    // Options related to the CLI some of them are mapped to SDK CLI attributes
    projectDir: toStringFlag(generatorOptionCli.projectDir)
  };

  async run() {
    const { flags } = this.parse(GenerateVdm);

    await generate(toGeneratorSDK(flags));
  }
}
