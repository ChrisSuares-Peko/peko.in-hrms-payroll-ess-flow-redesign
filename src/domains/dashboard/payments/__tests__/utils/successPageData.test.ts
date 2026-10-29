import { describe, expect, it } from 'vitest';

import { accessKeys } from '@utils/accessKeys';

import { getSuccessPageData } from '../../utils/utils';

const cardsTransaction = (orderResponse?: unknown) =>
    ({
        serviceOperator: { accessKey: accessKeys.corporateCards },
        ...(orderResponse !== undefined ? { orderResponse: JSON.stringify(orderResponse) } : {}),
    }) as never;

describe('getSuccessPageData for corporate cards', () => {
    it('names the last four digits of the ordered card', () => {
        const data = getSuccessPageData(cardsTransaction({ cardLast4: '1386' }), []);

        expect(data?.message).toContain('ending 1386');
    });

    it('sends the admin back to Corporate Cards with no leading slash', () => {
        const data = getSuccessPageData(cardsTransaction({ cardLast4: '1386' }), []);

        expect(data?.firstButtonTxt).toBe('Go to Corporate Cards');
        expect(data?.firstBtnLink).toBe('corporate-cards');
    });

    /**
     * A card the issuer has not confirmed has no number yet, and inventing one would be worse than
     * saying nothing.
     */
    it.each([
        ['the field is absent', {}],
        ['there is no order response at all', undefined],
        ['the value is not four digits', { cardLast4: '12' }],
        ['the value is not a number', { cardLast4: 'abcd' }],
        ['the value is null', { cardLast4: null }],
    ])('falls back to the generic dispatch line when %s', (_label, orderResponse) => {
        const data = getSuccessPageData(cardsTransaction(orderResponse), []);

        expect(data?.message).toContain('will be dispatched soon after confirmation');
        expect(data?.message).not.toContain('ending');
        expect(data?.message).not.toContain('null');
        expect(data?.message).not.toContain('undefined');
    });

    it('survives an unparseable order response', () => {
        const data = getSuccessPageData(
            { serviceOperator: { accessKey: accessKeys.corporateCards }, orderResponse: '{oops' } as never,
            []
        );

        expect(data?.message).toContain('will be dispatched soon after confirmation');
    });
});
