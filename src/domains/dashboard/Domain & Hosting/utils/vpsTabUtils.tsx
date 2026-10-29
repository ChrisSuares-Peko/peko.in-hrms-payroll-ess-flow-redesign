import React from 'react';

export const iconCircleClass =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full';

interface TabLayoutProps {
    image?: { src: string; alt: string };
    children: React.ReactNode;
}

export const TabLayout: React.FC<TabLayoutProps> = ({ image, children }) => (
    <div
        className="bg-white p-10"
        style={{
            boxShadow: '0px 2px 13px 0px rgba(25, 33, 61, 0.10)',
            borderRadius: '20px',
        }}
    >
        <div className="flex items-center gap-0">
            <div
                className="box-border"
                style={{ flex: image ? '0 0 60%' : '1', paddingRight: image ? 48 : 0 }}
            >
                {children}
            </div>
            {image && (
                <div className="flex items-center justify-center" style={{ flex: '0 0 40%' }}>
                    <img
                        src={image.src}
                        alt={image.alt}
                        className="block object-contain"
                        style={{ width: 320, height: 280 }}
                    />
                </div>
            )}
        </div>
    </div>
);
