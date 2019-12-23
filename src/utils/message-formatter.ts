/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

// The boxen dependency creates this warning in ci: Opening `/dev/tty` failed (6): Device not configured
// It is likely an issue of github actions: https://github.com/actions/runner/issues/241
// If this becomes an issue we will have to consider other solutions than boxen
import boxen = require('boxen');

export function boxMessage(lines: string[]): string {
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
