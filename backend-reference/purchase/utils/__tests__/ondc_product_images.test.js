const {
    isUsableImageUrl,
    usableImageUrls,
    hasUsableProductImage,
} = require('../ondc_product_images');

describe('isUsableImageUrl', () => {
    it('accepts http(s) URLs', () => {
        expect(isUsableImageUrl('https://cdn.example/a.jpg')).toBe(true);
        expect(isUsableImageUrl('http://cdn.example/a.jpg')).toBe(true);
    });

    it('rejects empty, non-http, and placeholder assets', () => {
        expect(isUsableImageUrl('')).toBe(false);
        expect(isUsableImageUrl(null)).toBe(false);
        expect(isUsableImageUrl('ftp://cdn.example/a.jpg')).toBe(false);
        expect(isUsableImageUrl('not-a-url')).toBe(false);
        expect(isUsableImageUrl('https://seller.example/placeholder.png')).toBe(false);
        expect(isUsableImageUrl('https://seller.example/no_image.jpg')).toBe(false);
        expect(isUsableImageUrl('https://seller.example/image-not-available.png')).toBe(false);
    });
});

describe('usableImageUrls / hasUsableProductImage', () => {
    it('keeps usable URLs and unwraps {url} objects', () => {
        expect(usableImageUrls([
            'https://seller.example/placeholder.png',
            { url: 'https://cdn.example/real.jpg' },
            '',
        ])).toEqual(['https://cdn.example/real.jpg']);
    });

    it('treats descriptor.symbol as a fallback image', () => {
        expect(hasUsableProductImage({ images: [], symbol: 'https://cdn.example/s.jpg' })).toBe(true);
        expect(hasUsableProductImage({ images: [], symbol: 'S' })).toBe(false);
        expect(hasUsableProductImage({ images: [], symbol: null })).toBe(false);
    });
});
