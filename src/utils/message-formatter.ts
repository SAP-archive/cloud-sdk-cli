/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import emojiRegex = require('emoji-regex/text');
import stringWidth = require('string-width');

export const lineWidth = 66;
const verticalBorder = '|';
const borderWidth = 2 * stringWidth(verticalBorder + ' ');

export function formatMessage(lines: string[]): string {
  return [border(), ...lines.map(line => formatLine(line)), border()].join('\n');
}

export function numberOfEmojis(line: string): number {
  return [...line.matchAll(emojiRegex())].length;
}

export function formatLine(line: string): string {
  // Emojis have wrong widths
  const maxMessageWidthForLine = lineWidth - borderWidth + numberOfEmojis(line);
  return `${verticalBorder} ${line.padEnd(maxMessageWidthForLine)} ${verticalBorder}`;
}

export function border(): string {
  return `+${''.padEnd(lineWidth - 2, '-')}+`;
}
