const {
  isCooling,
  markSearched,
  runExclusive,
  resetForTests,
} = require('../ondcCitySearchGate');

describe('ondcCitySearchGate', () => {
  afterEach(() => {
    resetForTests();
  });

  it('marks a city as cooling after a search so a second visitor does not fire again', () => {
    expect(isCooling('std:080')).toBe(false);
    markSearched('std:080');
    expect(isCooling('std:080')).toBe(true);
    expect(isCooling('std:022')).toBe(false);
  });

  it('runs concurrent callers as one exclusive search', async () => {
    let started = 0;
    const fn = async () => {
      started += 1;
      await new Promise((r) => setTimeout(r, 30));
      return 'done';
    };
    const [a, b] = await Promise.all([runExclusive('std:080', fn), runExclusive('std:080', fn)]);
    expect(a).toBe('done');
    expect(b).toBe('done');
    expect(started).toBe(1);
  });
});
