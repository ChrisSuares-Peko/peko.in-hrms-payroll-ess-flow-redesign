import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography, Upload } from 'antd';
import { RcFile } from 'antd/es/upload';

const { Text } = Typography;

interface LogoUploadStepProps {
    isUploadingLogo: boolean;
    logoFileName: string;
    onFileSelect: (file: RcFile) => boolean;
    onRemove: () => void;
}

// Step 3: Logo Upload — optional, so nothing else on this step needs validation.
const LogoUploadStep = ({ isUploadingLogo, logoFileName, onFileSelect, onRemove }: LogoUploadStepProps) => (
    <Flex vertical gap={8}>
        <Upload
            accept="image/jpeg,image/png,image/bmp"
            multiple={false}
            maxCount={1}
            showUploadList={false}
            beforeUpload={onFileSelect}
        >
            <div
                className="p-8 rounded-2xl border border-dashed cursor-pointer w-full text-left transition-colors hover:!border-[#ff4f4f] hover:bg-[#fff8f8]"
                style={{ borderColor: '#e4e7ec', backgroundColor: '#fafafa' }}
            >
                <Flex gap={16} align="center">
                    <div className="flex-shrink-0 bg-[#fff2f2] rounded-full w-12 h-12 flex items-center justify-center text-[#ff4f4f]">
                        <UploadOutlined style={{ fontSize: 20 }} />
                    </div>
                    <Flex vertical gap={4} className="flex-1 min-w-0">
                        <Text strong className="!text-[15px] !text-[#1e293b]">
                            Trademark a logo with word. Word and logo are trademarked.
                        </Text>
                        <Text type="secondary" className="!text-[13px] !leading-[19px]">
                            Upload black and white logo to register in all colors [Recommended]. Word on logo and
                            trademark must match. Image must be exactly 450 × 450 pixels.
                        </Text>
                    </Flex>
                </Flex>
            </div>
        </Upload>
        {isUploadingLogo && (
            <Flex align="center" gap={8} className="px-1">
                <Spin size="small" />
                <Text type="secondary" className="text-xs">
                    Uploading logo…
                </Text>
            </Flex>
        )}
        {!isUploadingLogo && logoFileName && (
            <Flex justify="space-between" align="center" className="px-1">
                <Text className="text-blue-500 line-clamp-1">{logoFileName}</Text>
                <Button icon={<DeleteOutlined />} size="small" danger type="text" onClick={onRemove} />
            </Flex>
        )}
    </Flex>
);

export default LogoUploadStep;
