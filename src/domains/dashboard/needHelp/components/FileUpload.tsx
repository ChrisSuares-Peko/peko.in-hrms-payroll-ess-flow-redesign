import { UploadOutlined } from '@ant-design/icons';
import { Button, Space, Upload } from 'antd';

const FileUpload = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Upload listType="picture" maxCount={1}>
            <Button icon={<UploadOutlined />}>Upload </Button>
        </Upload>
    </Space>
);

export default FileUpload;
