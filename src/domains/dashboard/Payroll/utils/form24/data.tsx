import { EyeOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export const form24Columns = [
    {
        title: 'Quarter',
        dataIndex: 'quarter',
        key: 'quarter',
    },
    {
        title: 'Financial Year',
        dataIndex: 'year',
        key: 'year',
    },
    {
        title: 'File Name',
        dataIndex: 'fileName',
        key: 'fileName',
        render: (_: any, record: any) => record.file?.name || '-',
    },
    {
        title: 'Updated On',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (_: any, record: any) =>
            record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : '-',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (_: any, record: any) => {
            console.log('Record in Status column:', record); // <-- Log the record
            return record.fileUrl ? (
                <span style={{ color: 'green' }}>Completed</span>
            ) : (
                <span style={{ color: 'red' }}>Not Uploaded</span>
            );
        },
    },
    {
        title: 'Action',
        key: 'action',
        render: (_: any, record: any) =>
            record.fileUrl ? (
                <Button
                    danger
                    className="text-red outline-none border-none"
                    icon={<EyeOutlined />}
                    onClick={() => window.open(record.fileUrl, '_blank', 'noopener,noreferrer')}
                >
                    View
                </Button>
            ) : (
                '-'
            ),
    },
];

export const steps = [
    {
        number: 1,
        title: 'Download Form 24Q',
        description: 'Download the Form 24Q Excel template to get started.',
    },
    {
        number: 2,
        title: 'Fill Form 24Q',
        description: 'Fill out the downloaded Form 24Q with the required information.',
    },
    {
        number: 3,
        title: 'Upload Form 24Q',
        description: 'Upload the completed Form 24Q back into the system.',
    },
    {
        number: 4,
        title: 'Add Signatures',
        description: 'Add the necessary signatures to the uploaded Form 24Q.',
    },
];

export const quarterOptions = [
    { value: 'Q1', label: 'Q1' },
    { value: 'Q2', label: 'Q2' },
    { value: 'Q3', label: 'Q3' },
    { value: 'Q4', label: 'Q4' },
];
