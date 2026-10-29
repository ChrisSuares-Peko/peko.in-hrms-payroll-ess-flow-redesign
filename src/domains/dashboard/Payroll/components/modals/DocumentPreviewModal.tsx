import { useEffect } from 'react';

import { Image } from 'antd';

interface DocumentPreviewModalProps {
    url: string | null;
    onClose: () => void;
}

// Only image documents can be previewed inline; other files (e.g. PDF, DOCX)
// don't render in an <img>-based preview — open those in a new tab instead.
const isImageUrl = (url: string): boolean =>
    /^data:image\//i.test(url) || /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url);

const DocumentPreviewModal = ({ url, onClose }: DocumentPreviewModalProps) => {
    useEffect(() => {
        if (url && !isImageUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
            onClose();
        }
    }, [url, onClose]);

    if (!url || !isImageUrl(url)) return null;

    return (
        <Image
            src={url}
            style={{ display: 'none' }}
            preview={{
                visible: true,
                onVisibleChange: visible => {
                    if (!visible) onClose();
                },
                src: url,
            }}
        />
    );
};

export default DocumentPreviewModal;
