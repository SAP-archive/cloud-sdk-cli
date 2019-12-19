/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import boxen = require('boxen');

export function formatMessage(lines: string[]): string {
  return boxen(lines.join('\n'), {
    borderStyle: {
      topLeft: '+',
      topRight: '+',
      bottomLeft: '+',
      bottomRight: '+',
      horizontal: '-',
      vertical: ' '
    }
  });
}
