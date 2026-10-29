const { isAllowedCatalogBpp } = require('../ondcCatalogBppAllowlist');

describe('isAllowedCatalogBpp', () => {
    it('allows when bpp_id contains any of the five seller names', () => {
        expect(isAllowedCatalogBpp({ bppId: 'www.shopclues.com' })).toBe(true);
        expect(isAllowedCatalogBpp({ bppId: 'prod.dpanda.in' })).toBe(true);
        expect(isAllowedCatalogBpp({ bppId: 'ondcseller-prod.costbo.com' })).toBe(true);
        expect(isAllowedCatalogBpp({ bppId: 'www.mystore.in' })).toBe(true);
        expect(isAllowedCatalogBpp({ bppId: 'ondc.shiprocket.in' })).toBe(true);
    });

    it('accepts Workbench by exact bpp_id', () => {
        expect(isAllowedCatalogBpp({ bppId: 'workbench.ondc.tech' })).toBe(true);
    });

    it('rejects uri-only, unknown, or missing bpp_id', () => {
        expect(isAllowedCatalogBpp({
            bppId: '',
            bppUri: 'https://ondc.shiprocket.in/bpp',
        })).toBe(false);
        expect(isAllowedCatalogBpp({ bppId: 'seller.bpp' })).toBe(false);
        expect(isAllowedCatalogBpp({ bppId: 'www.amazon.in' })).toBe(false);
        expect(isAllowedCatalogBpp({})).toBe(false);
        expect(isAllowedCatalogBpp({ bppId: '  ' })).toBe(false);
    });
});
