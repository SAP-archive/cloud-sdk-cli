/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
import cli from 'cli-ux';

export async function action(output: string, showSpinner: boolean, promise: Promise<any>) {
  if (showSpinner) {
    cli.action.start(output);
  } else {
    cli.log(`${output}...`);
  }
  await promise;
  if (showSpinner) {
    cli.action.stop();
  }
}
