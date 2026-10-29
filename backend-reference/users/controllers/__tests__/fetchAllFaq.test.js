jest.mock('../../models/use-cases/cities', () => ({ findCitiesByCountry: jest.fn() }));

const { fetchAllFaq } = require('../general');
const faq = require('../../public/FAQ.json');

const NEED_HELP_CATEGORIES = [
  'Mobile Recharge',
  'Bill Payments',
  'Corporate Travel',
  'Verification Suite',
  'WhatsApp for Business',
  'Turbo',
  'eSign',
  'Payroll',
  'eSIM',
  'General',
];

const fetchCategory = async (category) => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await fetchAllFaq({ query: { category } }, res, jest.fn());
  return res.json.mock.calls[0][0];
};

describe('fetchAllFaq', () => {
  it.each(NEED_HELP_CATEGORIES)('serves the %s questions linked from the Need Help page', async (category) => {
    const body = await fetchCategory(category);

    expect(body.status).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('returns an empty list for a category it does not know', async () => {
    const body = await fetchCategory('Unknown');

    expect(body.data).toEqual([]);
  });
});

describe('FAQ.json', () => {
  const entries = Object.entries(faq).flatMap(([category, items]) =>
    items.map(({ question, answer }) => [category, question, answer])
  );

  it.each(entries)('%s: "%s" has a non-empty question and answer', (_category, question, answer) => {
    expect(question.trim()).not.toBe('');
    expect(answer.trim()).not.toBe('');
  });

  it('never mixes bullet lines with plain lines inside one block', () => {
    const mixedBlocks = entries.flatMap(([category, question, answer]) =>
      answer
        .split(/\n\s*\n/)
        .filter((block) => {
          const lines = block.split('\n');
          const bullets = lines.filter((line) => line.startsWith('- ')).length;
          return bullets > 0 && bullets !== lines.length;
        })
        .map(() => `${category}: ${question}`)
    );

    expect(mixedBlocks).toEqual([]);
  });
});
