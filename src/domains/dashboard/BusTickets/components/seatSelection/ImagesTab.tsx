import { useEffect, useState } from 'react';

import { Flex, Spin } from 'antd';

const placeholderGrid = (
    <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[180, 130, 130, 130, 130].map((height, i) => (
                <div
                    key={i}
                    style={{
                        height,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                        gridColumn: i === 0 ? 'span 2' : undefined,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c0c0c0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
            ))}
        </div>
    </div>
);

export default function ImagesTab({ imagesMetadataUrl, busImageCount }: { imagesMetadataUrl?: string; busImageCount?: string }) {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
        if (!imagesMetadataUrl || fetched) return;
        setLoading(true);
        fetch(imagesMetadataUrl)
            .then(r => r.json())
            .then(data => {
                let urls: string[] = [];
                if (Array.isArray(data)) {
                    urls = data.map((item: any) => item?.image_url ?? item?.url ?? item).filter((u: any) => typeof u === 'string');
                } else if (data?.bus_image_metadatas) {
                    urls = (data.bus_image_metadatas as any[]).map((item: any) => item?.image_url ?? item?.url).filter(Boolean);
                } else if (data?.images) {
                    urls = (data.images as any[]).map((item: any) => item?.image_url ?? item?.url ?? item).filter((u: any) => typeof u === 'string');
                }
                setImages(urls);
            })
            .catch(() => setImages([]))
            .finally(() => { setLoading(false); setFetched(true); });
    }, [imagesMetadataUrl, fetched]);

    const count = parseInt(busImageCount ?? '0', 10);

    if (!imagesMetadataUrl || count <= 0) return placeholderGrid;

    if (loading) {
        return (
            <Flex align="center" justify="center" style={{ padding: '40px 18px' }}>
                <Spin />
            </Flex>
        );
    }

    if (images.length === 0) return placeholderGrid;

    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {images.map((url, i) => (
                    <img
                        key={url}
                        src={url}
                        alt={`Bus view ${i + 1}`}
                        style={{
                            width: '100%',
                            height: i === 0 ? 180 : 130,
                            objectFit: 'cover',
                            borderRadius: 8,
                            gridColumn: i === 0 ? 'span 2' : undefined,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
