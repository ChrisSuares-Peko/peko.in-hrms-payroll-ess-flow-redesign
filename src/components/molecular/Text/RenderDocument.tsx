import React from 'react';

import { Button } from 'antd';

import useFileDownloader from '@src/hooks/useFileDownloader';

interface RenderDocumentProps {
    label: any;
    doc: string;
    type?: 'link' | 'button';
    className?: string;
    style?: React.CSSProperties;
    size?: 'small' | 'middle' | 'large';
    disabled?: boolean;
}

const RenderDocument: React.FC<RenderDocumentProps> = ({
    label = 'Document',
    doc,
    type = 'link',
    className,
    style,
    size = 'middle',
    disabled = false,
}) => {
    const { downloadDocument, isLoading } = useFileDownloader();
  
    return (
        <Button
            type={type === 'button' ? 'primary' : 'link'}
            danger
            disabled={disabled}
            onClick={() => downloadDocument(doc)}
            loading={isLoading}
            style={style}
            size={size}
        >
            {label}
        </Button>
    );
};

export default RenderDocument;
