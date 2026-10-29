const fs = require('fs');
const path = require('path');

describe('raiseOndcIssue persist-before-send', () => {
  it('creates the ondcIssues row before posting /issue', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../controllers/corporate/ondcEcommerce.js'),
      'utf8'
    );
    const start = src.indexOf('exports.raiseOndcIssue');
    const end = src.indexOf('exports.respondToOndcIssue');
    const raise = src.slice(start, end);
    expect(raise.indexOf('createOndcIssue')).toBeGreaterThan(-1);
    expect(raise.indexOf('await ondc.issue')).toBeGreaterThan(-1);
    expect(raise.indexOf('createOndcIssue')).toBeLessThan(raise.indexOf('await ondc.issue'));
  });
});
