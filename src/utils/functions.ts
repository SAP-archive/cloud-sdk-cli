/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

export interface Confirm {
  confirm: (message: string) => Promise<boolean>;
}

function confirm(message: string): Promise<boolean> {
  return Promise.resolve(true);
}

export const testFunctions = {
  confirm
};
