import { OndcProduct, ProductCardProps } from '../types/products';

const isUsableImageUrl = (value?: string | null) => {
    const url = String(value || '').trim();
    if (!url) return false;
    if (!/^https?:\/\//i.test(url)) return false;
    if (/placeholder|no[_-]?image|image[_-]?not[_-]?available/i.test(url)) return false;
    return true;
};

/** First usable product image URL, or empty string. */
export const resolveProductImageUrl = (
    product: Pick<OndcProduct, 'images' | 'symbol'>
): string => {
    const fromImages = Array.isArray(product.images)
        ? product.images.find(isUsableImageUrl)
        : null;
    if (fromImages) return String(fromImages).trim();
    if (isUsableImageUrl(product.symbol)) return String(product.symbol).trim();
    return '';
};

type ProductListRow = Pick<
    OndcProduct,
    | 'id'
    | 'ondcProductId'
    | 'name'
    | 'images'
    | 'symbol'
    | 'price'
    | 'availableQuantity'
    | 'minQuantity'
    | 'maxPrice'
    | 'vendorName'
>;

const toProductCard = (product: ProductListRow): ProductCardProps => {
    // No usable image is NOT a reason to hide a product the backend chose to
    // return — the card renders a placeholder instead. The backend still filters
    // imageless products by default, so this only shows them when it deliberately
    // opted in (lenient catalog ingest).
    const image = resolveProductImageUrl(product);
    return {
        id: product.id,
        ondcProductId: product.ondcProductId,
        name: product.name,
        image,
        price: product.price,
        quantity: product.availableQuantity,
        minQuantity: product.minQuantity,
        actualPrice: product.maxPrice,
        savePrice: product.maxPrice,
        soldBy: product.vendorName?.trim(),
    };
};

/**
 * Map listing rows to cards. Rows without a usable image keep their place and
 * render the placeholder — deciding what is listable is the backend's job, and
 * silently dropping rows here made an empty grid impossible to diagnose.
 */
export const mapProductsWithImages = (rows?: ProductListRow[] | null): ProductCardProps[] =>
    (rows || []).map(toProductCard);
