import { OndcProduct } from './products';

export type ProductImage = {
    id: number;
    productImageUrl: string;
    imageField: string;
    productId: number;
};

export type ProductDetailsPayload = {
    userId: number;
    userType: string;
    ondcProductId: string;
};

/**
 * ONDC product detail is the same single row shape as a list row (the backend
 * `fetchOndcProductDetail` returns one ondcProducts row).
 */
export type ProductDetails = OndcProduct;

/** Backend returns the single ONDC row directly as `data`. */
export type ProductDetailsResponse = ProductDetails;
