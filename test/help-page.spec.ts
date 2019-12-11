/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

const url = jest.fn();
const openSpy = jest.fn();
jest.mock('cli-ux', () => {
  // Mocking needs to happen before the command is imported
  const cli = jest.requireActual('cli-ux');
  return {
    ...cli,
    default: {
      ...cli.default,
      url,
      open: openSpy
    }
  };
});
import HelpPage from '../src/commands/help-page';

describe('Help Page', () => {
  it('should display the link and open the SDK website', async () => {
    await HelpPage.run();

    const helpPageUrl = 'https://developers.sap.com/topics/cloud-sdk.html';
    expect(url).toHaveBeenCalledWith(helpPageUrl, helpPageUrl);
    expect(openSpy).toHaveBeenCalledWith(helpPageUrl);
  }, 60000);
});
