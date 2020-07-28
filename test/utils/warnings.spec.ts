/*!
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

import { getWarnings, recordWarning } from '../../src/utils/warnings';
import { TimeThresholds } from '../test-utils';

describe('warnings', () => {
  it(
    'should record and return warnings',
    () => {
      recordWarning('test warning');
      expect(getWarnings()).toEqual(['- test warning']);
    },
    TimeThresholds.DEFAULT
  );

  it(
    'should record and return multiple warnings',
    () => {
      recordWarning('test1');
      recordWarning('test2');
      expect(getWarnings()).toEqual(['- test1', '- test2']);
    },
    TimeThresholds.DEFAULT
  );

  it(
    'should record and return multi-line warnings',
    () => {
      recordWarning('line1', 'line2', 'line3');
      expect(getWarnings()).toEqual(['- line1\n  line2\n  line3']);
    },
    TimeThresholds.DEFAULT
  );
});
