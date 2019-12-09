/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import cli from 'cli-ux';
import * as fs from 'fs';
import * as path from 'path';

export async function usageAnalytics(projectDir: string, agreeToAnalytics: boolean, salt?: string) {
  if (agreeToAnalytics === false) {
    return;
  }

  if (agreeToAnalytics || (await cli.confirm('Do you want to provide anonymous usage analytics to help us improve the SDK? (y|n)'))) {
    const jsonContent = salt ? { enabled: true, salt } : { enabled: true };
    fs.writeFileSync(path.resolve(projectDir, 'sap-cloud-sdk-analytics.json'), JSON.stringify(jsonContent));
  }
}
