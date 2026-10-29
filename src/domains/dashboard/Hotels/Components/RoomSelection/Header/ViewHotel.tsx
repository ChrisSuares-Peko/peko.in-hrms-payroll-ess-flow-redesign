import { useMemo, useState } from 'react';

import { Col, Image, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';

import defaultImage from '../../../Assets/defaultImage.jpg';

const VISIBLE_COUNT = 5;

const ViewHotel = ({ image }: any) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [current, setCurrent] = useState(0);

    // Remove empty / duplicate urls returned by the API
    const images: string[] = useMemo(
        () =>
            Array.from(
                new Set(
                    (Array.isArray(image) ? image : []).filter(
                        (img: string) => typeof img === 'string' && img.trim() !== '',
                    ),
                ),
            ),
        [image],
    );

    const previewItems = images.length ? images : [defaultImage];
    const remainingCount = images.length - VISIBLE_COUNT;

    // Falls back to the first image (or default) when fewer than 5 images exist
    const getSrc = (index: number) => images[index] ?? images[0] ?? defaultImage;

    const openPreview = (index: number) => {
        setCurrent(images[index] ? index : 0);
        setPreviewOpen(true);
    };

    const renderTile = (index: number, height: number, borderRadius?: string) => {
        const showMore = index === VISIBLE_COUNT - 1 && remainingCount > 0;
        return (
            <div
                className="relative cursor-pointer overflow-hidden"
                style={{ borderRadius }}
                role="button"
                tabIndex={0}
                onClick={() => openPreview(index)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') openPreview(index);
                }}
            >
                <Image
                    height={height}
                    width="100%"
                    src={getSrc(index)}
                    fallback={defaultImage}
                    preview={false}
                    rootClassName="!block"
                    style={{ display: 'block', objectFit: 'cover', borderRadius }}
                />
                {showMore && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-base font-semibold text-white"
                        style={{ borderRadius }}
                    >
                        +{remainingCount} photos
                    </div>
                )}
            </div>
        );
    };

    return (
        <Content>
            <Row gutter={5}>
                <Col span={14}>{renderTile(0, 385, '1.25rem 0 0 1.25rem')}</Col>
                <Col span={10}>
                    <Row gutter={5}>
                        <Col span={12}>{renderTile(1, 190, '0.625rem')}</Col>
                        <Col span={12}>{renderTile(2, 190, '0 1.25rem 0 0')}</Col>
                    </Row>
                    <Row gutter={5}>
                        <Col span={12}>{renderTile(3, 190, '0.625rem')}</Col>
                        <Col span={12}>{renderTile(4, 190, '0 0 1.25rem 0')}</Col>
                    </Row>
                </Col>
            </Row>

            <Image.PreviewGroup
                items={previewItems}
                preview={{
                    visible: previewOpen,
                    current,
                    onVisibleChange: value => setPreviewOpen(value),
                    onChange: value => setCurrent(value),
                }}
            />
        </Content>
    );
};

export default ViewHotel;
