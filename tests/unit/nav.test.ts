import { describe, expect, it } from 'vitest';
import { isCurrentPath } from '../../src/lib/nav';

describe('isCurrentPath', () => {
  it('トップは完全一致のときだけ', () => {
    expect(isCurrentPath('/', '/')).toBe(true);
    expect(isCurrentPath('/', '/works/')).toBe(false);
  });

  it('下層ページも現在地として扱う', () => {
    expect(isCurrentPath('/works/', '/works/')).toBe(true);
    expect(isCurrentPath('/works/', '/works/noteflip/')).toBe(true);
  });

  it('別のページは現在地にしない', () => {
    expect(isCurrentPath('/works/', '/services/')).toBe(false);
    expect(isCurrentPath('/blog/', '/blogroll/')).toBe(false);
  });
});
