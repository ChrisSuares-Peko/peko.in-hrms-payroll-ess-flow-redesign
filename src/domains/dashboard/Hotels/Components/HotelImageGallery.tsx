import { useMemo, useState } from 'react';

import { Image } from 'antd';

import defaultImage from '../Assets/defaultImage.jpg';

interface HotelImageGalleryProps {
    images?: (string | undefined)[];
    height?: number | string;
}

// Single hotel image with a "+N" thumbnail; clicking opens a preview of all images
const HotelImageGallery = ({ images: imageList, height = 180 }: HotelImageGalleryProps) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [current, setCurrent] = useState(0);

    // Remove empty / duplicate urls
    const images: string[] = useMemo(
        () =>
            Array.from(
                new Set(
                    (imageList ?? []).filter(
                        (img): img is string => typeof img === 'string' && img.trim() !== '',
                    ),
                ),
            ),
        [imageList],
    );

    // The +N thumbnail already shows the second image, so it is not counted
    const remainingCount = images.length - 1;

    const openPreview = (index: number) => {
        setCurrent(images[index] ? index : 0);
        setPreviewOpen(true);
    };

    return (
        <>
            <div
                className="relative cursor-pointer overflow-hidden"
                style={{ borderRadius: '0.625rem' }}
                role="button"
                tabIndex={0}
                onClick={() => openPreview(0)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') openPreview(0);
                }}
            >
                <Image
                    width="100%"
                    height={height}
                    src={images[0] ?? defaultImage}
                    fallback={defaultImage}
                    preview={false}
                    rootClassName="!block"
                    style={{
                        display: 'block',
                        borderRadius: '0.625rem',
                        objectFit: 'cover',
                    }}
                />
                {remainingCount > 0 && (
                    <div
                        className="absolute bottom-2 right-2 h-14 w-14 overflow-hidden"
                        style={{ borderRadius: '0.5rem' }}
                        role="button"
                        tabIndex={0}
                        onClick={e => {
                            e.stopPropagation();
                            openPreview(1);
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                openPreview(1);
                            }
                        }}
                    >
                        <Image
                            width="100%"
                            height="100%"
                            src={images[1]}
                            fallback={defaultImage}
                            preview={false}
                            rootClassName="!block h-full"
                            style={{ display: 'block', objectFit: 'cover' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                            +{remainingCount}
                        </div>
                    </div>
                )}
            </div>
            <Image.PreviewGroup
                items={images.length ? images : [defaultImage]}
                preview={{
                    visible: previewOpen,
                    current,
                    onVisibleChange: value => setPreviewOpen(value),
                    onChange: value => setCurrent(value),
                }}
            />
        </>
    );
};

export default HotelImageGallery;
