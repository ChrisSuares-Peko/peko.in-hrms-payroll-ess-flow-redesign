import { useRef, useState } from 'react';

import {
    CloseOutlined,
    LoadingOutlined,
    LockOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Spin, Typography } from 'antd';

import { paths } from '@src/routes/paths';

interface Props {
    url: string;
    onComplete: (resultUrl: string) => void;
    onClose: () => void;
}

const CCavenueIframeModal = ({ url, onComplete, onClose }: Props) => {
    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleLoad = () => {
        setIsIframeLoading(false);
        try {
            const href = iframeRef.current?.contentWindow?.location?.href;
            if (!href) return;
            const { pathname } = new URL(href);
            if (
                pathname.includes(paths.payments.paymentsuccess) ||
                pathname.includes(paths.payments.paymentPending) ||
                pathname.includes(paths.payments.paymentFailure)
            ) {
                onComplete(href);
            }
        } catch {
            // Cross-origin (CCAvenue domain) — expected, ignore
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(2px)',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 860,
                    margin: '0 16px',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#fff',
                    height: '80vh',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        background: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: '#f0fdf4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <LockOutlined style={{ color: '#16a34a', fontSize: 14 }} />
                        </div>
                        <div>
                            <Typography.Text
                                strong
                                style={{ fontSize: 15, display: 'block', lineHeight: 1.2 }}
                            >
                                Secure Payment
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 11, color: '#9ca3af' }}>
                                256-bit SSL encrypted
                            </Typography.Text>
                        </div>
                    </div>
                    <Button
                        type="text"
                        onClick={onClose}
                        icon={<CloseOutlined />}
                        style={{
                            color: '#6b7280',
                            fontWeight: 500,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            height: 36,
                            borderRadius: 8,
                        }}
                    >
                        Close
                    </Button>
                </div>

                {/* Iframe area — fills all space between header and footer */}
                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        position: 'relative',
                        margin: 0,
                        padding: 0,
                        overflow: 'hidden',
                    }}
                >
                    {isIframeLoading && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 16,
                                background: '#fafafa',
                                zIndex: 1,
                            }}
                        >
                            <Spin
                                indicator={
                                    <LoadingOutlined
                                        style={{ fontSize: 40, color: '#e11d48' }}
                                        spin
                                    />
                                }
                            />
                            <Typography.Text style={{ color: '#6b7280', fontSize: 14 }}>
                                Loading payment gateway…
                            </Typography.Text>
                        </div>
                    )}
                    <iframe
                        ref={iframeRef}
                        src={url}
                        title="CCAvenue Payment"
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            display: 'block',
                            margin: 0,
                            padding: 0,
                            verticalAlign: 'top',
                        }}
                        onLoad={handleLoad}
                        allow="payment"
                    />
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '10px 16px',
                        background: '#f9fafb',
                        borderTop: '1px solid #f0f0f0',
                        flexShrink: 0,
                    }}
                >
                    <SafetyCertificateOutlined style={{ color: '#16a34a', fontSize: 12 }} />
                    <Typography.Text style={{ fontSize: 11, color: '#9ca3af' }}>
                        100% Secure &amp; Encrypted Payment powered by CCAvenue
                    </Typography.Text>
                </div>
            </div>
        </div>
    );
};

export default CCavenueIframeModal;
