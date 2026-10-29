import { useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Form, Typography, Flex } from 'antd';

const { Text } = Typography;
interface XLSXInputProps {
    name: string;
    label?: string;
    onFileChange: (file: File | null) => void;
    showFileName?: boolean;
}

const XLSXInput = ({ name, label, onFileChange, showFileName = false }: XLSXInputProps) => {
    const [fileName, setFileName] = useState<string | null>(null);

    const handleChange = (info: any) => {
        if (info.file.status === 'done') {
            setFileName(info.file.name);

            onFileChange(info.file.originFileObj);
        } else if (info.file.status === 'removed') {
            setFileName(null);
            onFileChange(null);
        }
    };

    return (
        <Form.Item name={name} noStyle>
            <Flex vertical gap={4}>
                {showFileName && fileName && <Text className="text-blue-500">{fileName}</Text>}
                <Upload accept=".xlsx" maxCount={1} showUploadList={false} onChange={handleChange}>
                    <Button icon={<UploadOutlined />}>Click to upload XLSX</Button>
                </Upload>
            </Flex>
        </Form.Item>
    );
};

export default XLSXInput;
