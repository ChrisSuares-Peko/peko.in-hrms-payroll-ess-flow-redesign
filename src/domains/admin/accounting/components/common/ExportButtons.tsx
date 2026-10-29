import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

import { ExportFormat } from '../../types/export';

type Props = {
    onExport: (format: ExportFormat) => void;
    loadingFormat: ExportFormat | null;
    disabled?: boolean;
};

const ExportButtons = ({ onExport, loadingFormat, disabled }: Props) => {
    const busy = loadingFormat !== null;
    return (
        <Flex gap={8} wrap="wrap">
            <Button
                icon={<DownloadOutlined />}
                loading={loadingFormat === 'excel'}
                disabled={disabled || busy}
                onClick={() => onExport('excel')}
            >
                Export Excel
            </Button>
            <Button
                icon={<FilePdfOutlined />}
                loading={loadingFormat === 'pdf'}
                disabled={disabled || busy}
                onClick={() => onExport('pdf')}
            >
                Download PDF
            </Button>
        </Flex>
    );
};

export default ExportButtons;
