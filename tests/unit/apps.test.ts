import { describe, expect, it } from 'vitest';
import { appDocPath } from '../../src/lib/apps';

describe('appDocPath', () => {
  it('日本語は /apps/{app}/{doc}/', () => {
    expect(appDocPath('noteflip', 'privacy', 'ja')).toBe('/apps/noteflip/privacy/');
  });

  it('英語は /apps/{app}/en/{doc}/', () => {
    expect(appDocPath('noteflip', 'support', 'en')).toBe('/apps/noteflip/en/support/');
  });
});
