/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import stringWidth = require('string-width');
import { border, formatLine, formatMessage, lineWidth, numberOfEmojis } from '../../src/utils/message-formatter';

describe('Message Formatter Utils', () => {
  describe('should add borders and empty spaces to line', () => {
    function expectLineMeetsRequirements(actual: string) {
      expect(actual).toStartWith('| ');
      expect(actual).toEndWith(' |');
      expect(stringWidth(actual)).toEqual(lineWidth + numberOfEmojis(actual));
    }

    it('for empty string', () => {
      expectLineMeetsRequirements(formatLine(''));
    });

    it('for list item string', () => {
      expectLineMeetsRequirements(formatLine('- Some text.'));
    });

    it('for emoji string', () => {
      expectLineMeetsRequirements(formatLine('🚀  Some text.'));
    });
  });

  it('should render correct border', () => {
    expect(stringWidth(border())).toEqual(lineWidth);
  });

  it('should render message box', () => {
    const lines = ['Some text', '', '🔨  Some Action:', '- Some List Item'];
    expect(formatMessage(lines)).toMatch(
      `+----------------------------------------------------------------+
| Some text                                                      |
|                                                                |
| 🔨  Some Action:                                                |
| - Some List Item                                               |
+----------------------------------------------------------------+`
    );
  });
});
