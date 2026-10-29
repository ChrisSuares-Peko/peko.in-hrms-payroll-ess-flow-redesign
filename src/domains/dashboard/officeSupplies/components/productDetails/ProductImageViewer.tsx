import { useEffect, type FC } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Flex, Modal } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import { ProductImage as ProductImageType } from '../../types/productDetails';
import ProductImageView from '../common/ProductImageView';

interface ProductImageViewerProps {
    open: boolean;
    images: ProductImageType[];
    /** image shown — shared with the page gallery, so closing leaves you on it */
    index: number;
    onIndexChange: (index: number) => void;
    onClose: () => void;
    name?: string;
}

/**
 * Enlarged product image viewer (PDP): a centred card over the dimmed page with a
 * large image panel and the thumbnail strip below it. No on-screen arrows (per the
 * design) — thumbnails pick the image, and ←/→ step through it from the keyboard.
 */
const ProductImageViewer: FC<ProductImageViewerProps> = ({
    open,
    images,
    index,
    onIndexChange,
    onClose,
    name,
}) => {
    const { sm } = useScreenSize();
    const count = images?.length || 0;
    const current = images?.[index]?.productImageUrl || images?.[0]?.productImageUrl || '';

    useEffect(() => {
        if (!open || count < 2) return undefined;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') onIndexChange(Math.min(count - 1, index + 1));
            if (event.key === 'ArrowLeft') onIndexChange(Math.max(0, index - 1));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, count, index, onIndexChange]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            centered
            width={520}
            styles={{ content: { borderRadius: 24, padding: sm ? 20 : 16 } }}
        >
            <Flex vertical gap={16}>
                <Flex justify="end">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3f4f6] transition-colors hover:bg-[#e5e7eb]"
                    >
                        <CloseOutlined className="text-[11px] text-[#6a7282]" />
                    </button>
                </Flex>

                <div
                    data-testid="viewer-main"
                    className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f7f7f7]"
                >
                    <ProductImageView
                        src={current}
                        alt={name}
                        className="max-h-[88%] max-w-[92%] object-contain mix-blend-multiply"
                        placeholderClassName="h-[35%] w-[35%] opacity-40"
                    />
                </div>

                {count > 1 && (
                    <div className="hide-scrollbar w-full overflow-x-auto">
                        <div className="mx-auto flex w-max gap-3 py-1">
                            {images.map((img, i) => (
                                <button
                                    key={img.id ?? i}
                                    type="button"
                                    aria-label={`Show image ${i + 1} of ${count}`}
                                    aria-pressed={i === index}
                                    onClick={() => onIndexChange(i)}
                                    className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[#f7f7f7] transition-colors sm:h-16 sm:w-16 ${
                                        i === index ? 'border-lightRed' : 'border-[#ededed]'
                                    }`}
                                >
                                    <ProductImageView
                                        src={img.productImageUrl}
                                        alt={`${name}-${i}`}
                                        className="max-h-[80%] max-w-[80%] object-contain mix-blend-multiply"
                                        placeholderClassName="h-[45%] w-[45%] opacity-40"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Flex>
        </Modal>
    );
};

export default ProductImageViewer;
