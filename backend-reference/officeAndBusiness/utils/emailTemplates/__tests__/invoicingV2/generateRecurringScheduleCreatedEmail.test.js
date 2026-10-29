const { generateRecurringScheduleCreatedEmail } = require('../../invoicingV2');

describe('generateRecurringScheduleCreatedEmail', () => {
    const baseParams = {
        startDate: '2026-01-01',
        frequency: 'Monthly',
    };

    const partnerWithLogo = { logo: 'https://example.com/logo.png', name: 'Test Corp' };
    const partnerWithoutLogo = { name: 'Test Corp' };

    it('should contain "Forever" when endCondition type is FOREVER', () => {
        const html = generateRecurringScheduleCreatedEmail(
            { ...baseParams, endCondition: { type: 'FOREVER' } },
            partnerWithoutLogo
        );
        expect(html).toContain('Forever');
    });

    it('should contain "After 3 run(s)" when endCondition type is AFTER with runs 3', () => {
        const html = generateRecurringScheduleCreatedEmail(
            { ...baseParams, endCondition: { type: 'AFTER', runs: 3 } },
            partnerWithoutLogo
        );
        expect(html).toContain('After 3 run(s)');
    });

    it('should contain "On 2026-12-31" when endCondition type is ON with that date', () => {
        const html = generateRecurringScheduleCreatedEmail(
            { ...baseParams, endCondition: { type: 'ON', date: '2026-12-31' } },
            partnerWithoutLogo
        );
        expect(html).toContain('On 2026-12-31');
    });

    it('should contain "Forever" when endCondition is not provided', () => {
        const html = generateRecurringScheduleCreatedEmail(
            { ...baseParams },
            partnerWithoutLogo
        );
        expect(html).toContain('Forever');
    });

    it('should render an <img> tag when partnerDetails has a logo', () => {
        const html = generateRecurringScheduleCreatedEmail(
            { ...baseParams, endCondition: { type: 'FOREVER' } },
            partnerWithLogo
        );
        expect(html).toContain('<img');
    });

    it('should NOT render an <img> tag when partnerDetails has no logo', () => {
        const html = generateRecurringScheduleCreatedEmail(
            { ...baseParams, endCondition: { type: 'FOREVER' } },
            partnerWithoutLogo
        );
        expect(html).not.toContain('<img');
    });

    it('should always contain startDate, frequency, "ACTIVE", and "www.peko.one"', () => {
        const html = generateRecurringScheduleCreatedEmail(
            { ...baseParams, endCondition: { type: 'FOREVER' } },
            partnerWithoutLogo
        );
        expect(html).toContain('2026-01-01');
        expect(html).toContain('Monthly');
        expect(html).toContain('ACTIVE');
        expect(html).toContain('www.peko.one');
    });
});
