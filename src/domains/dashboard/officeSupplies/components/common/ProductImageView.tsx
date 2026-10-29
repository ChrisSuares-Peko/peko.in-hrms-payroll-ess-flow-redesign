import { useEffect, useState, type FC, type ImgHTMLAttributes } from 'react';

import noProductsSVG from '../../assets/icons/noProducts.svg';

type ProductImageViewProps = ImgHTMLAttributes<HTMLImageElement> & {
    /** Shown when src is empty or the image fails to load (ignored when hideOnFail). */
    placeholderClassName?: string;
    /**
     * When true, render nothing if the image is missing or fails — parent cards
     * should hide the product entirely instead of showing a placeholder.
     */
    hideOnFail?: boolean;
    /** Fired once when the image is missing or fails to load. */
    onUnavailable?: () => void;
};

/**
 * Product image with optional fallback. Listing cards pass `hideOnFail` so a
 * missing/corrupt image removes the product from the UI instead of a placeholder.
 */
const ProductImageView: FC<ProductImageViewProps> = ({
    src,
    alt = '',
    className,
    placeholderClassName = 'h-[40%] w-[40%] opacity-40',
    hideOnFail = false,
    onUnavailable,
    onError,
    ...rest
}) => {
    const [failed, setFailed] = useState(false);
    const unavailable = failed || !src;

    useEffect(() => {
        setFailed(false);
    }, [src]);

    useEffect(() => {
        if (unavailable) onUnavailable?.();
    }, [unavailable, onUnavailable]);

    if (unavailable) {
        if (hideOnFail) return null;
        return (
            <img
                src={noProductsSVG}
                alt={alt || 'Product unavailable'}
                className={`object-contain ${placeholderClassName}`}
                aria-hidden={!alt}
            />
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={e => {
                setFailed(true);
                onError?.(e);
            }}
            {...rest}
        />
    );
};

export default ProductImageView;
