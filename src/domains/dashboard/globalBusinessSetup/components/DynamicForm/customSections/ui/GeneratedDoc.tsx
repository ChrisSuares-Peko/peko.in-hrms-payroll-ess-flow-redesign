import { useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { toPdfFile } from '../pdf/generatePdf';

type GeneratedDocProps = {
    label: string;
    // Current document HTML — the PDF is generated from this on click, so the
    // download always matches the live preview (never a stale pre-generated copy).
    html: string;
    fileName: string;
};

export default function GeneratedDoc({ label, html, fileName }: GeneratedDocProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);

        try {
            const file = await toPdfFile(html, fileName);
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button icon={<DownloadOutlined />} loading={loading} onClick={handleDownload}>
            Download {label}
        </Button>
    );
}
