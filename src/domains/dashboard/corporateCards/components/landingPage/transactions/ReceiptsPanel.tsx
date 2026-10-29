import { DeleteOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';

import exportIcon from '../../../assets/icons/export.svg';
import fileIcon from '../../../assets/icons/file.svg';
import { useReceiptsApi } from '../../../hooks/user/useReceiptsApi';
import { ReceiptFile } from '../../../utils/types';
import SectionCard from '../../common/SectionCard';

const { Text } = Typography;

const ACCEPTED = '.pdf,.png,.jpg,.jpeg';

interface ReceiptsPanelProps {
    transactionId: string;
}

/** Transaction-detail "Receipts" panel: upload a receipt and view/delete the files on this transaction. */
const ReceiptsPanel = ({ transactionId }: ReceiptsPanelProps) => {
    const { receipts, isLoading, upload, uploading, remove } = useReceiptsApi(transactionId);

    const columns: ColumnsType<ReceiptFile> = [
        {
            key: 'file',
            title: 'File',
            dataIndex: 'fileName',
            render: (fileName: string, row) => (
                <div className="flex items-center gap-2">
                    <img src={fileIcon} alt="" className="h-4 w-4 shrink-0" />
                    {row.url ? (
                        <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-textLightRed hover:underline"
                        >
                            {fileName}
                        </a>
                    ) : (
                        <Text className="text-sm text-textHeadings">{fileName}</Text>
                    )}
                </div>
            ),
        },
        {
            key: 'date',
            title: 'Date',
            dataIndex: 'date',
            render: (date: string) => <Text className="text-sm text-textBody">{date}</Text>,
        },
        {
            key: 'uploadedBy',
            title: 'Uploaded by',
            dataIndex: 'uploadedBy',
            render: (uploadedBy: string) => (
                <Text className="text-sm text-textBody">{uploadedBy}</Text>
            ),
        },
        {
            key: 'actions',
            title: '',
            width: 56,
            render: (_, row) => (
                <Popconfirm
                    title="Delete this receipt?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => remove(row.id)}
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <SectionCard title="Receipts">
            <div className="flex flex-col gap-4">
                <div className="flex justify-end">
                    <Upload
                        accept={ACCEPTED}
                        showUploadList={false}
                        beforeUpload={file => {
                            upload(file as File);
                            return false; // prevent antd's default auto-upload; we handle it ourselves
                        }}
                    >
                        <Button
                            danger
                            loading={uploading}
                            icon={<img src={exportIcon} alt="" className="h-4 w-4" />}
                        >
                            Upload receipt
                        </Button>
                    </Upload>
                </div>
                <div className="overflow-hidden rounded-xl border border-borderCard [&>div:first-child]:!mb-0">
                    <GenericTable
                        columns={columns}
                        dataSource={receipts}
                        loading={isLoading}
                        rowKey="key"
                    />
                </div>
            </div>
        </SectionCard>
    );
};

export default ReceiptsPanel;
