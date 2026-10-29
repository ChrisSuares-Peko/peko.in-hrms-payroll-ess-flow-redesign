import { FileImageOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Row, Typography, Upload } from 'antd';

type Props = {};
const CreatePaymentLink = (props: Props) => (
    <Row className="xs:px-0 w-full md:px-8 mt-6">
        <Flex className="w-full" wrap="wrap" justify="space-between">
            <Typography.Text className="text-valueText text-3xl">Payment Link</Typography.Text>
        </Flex>
        <Col className="mt-4" xs={24} md={8}>
            <Flex gap="small" vertical>
                <Flex align="start" gap="small" vertical>
                    <Typography.Text>Payment Name</Typography.Text>
                    <Input className="w-full " />
                </Flex>
                <Flex align="start" gap="small" vertical>
                    <Typography.Text>Description</Typography.Text>
                    <Input.TextArea
                        className="w-full "
                        placeholder="Controlled autosize"
                        autoSize={{ minRows: 3, maxRows: 5 }}
                    />
                </Flex>
                <Flex align="start" gap="small" vertical>
                    <Typography.Text>Amount</Typography.Text>
                    <Input className="w-full " />
                </Flex>
                <Button type="primary" className=" mt-4 w-44 xs:hidden md:block" danger>
                    Create Link
                </Button>
            </Flex>
        </Col>

        <Col className="xs:ms-0 md:ms-10 mt-6" xs={24} md={8}>
            <Flex vertical>
                <Typography.Text>Upload Invoice or Image</Typography.Text>
                <Upload.Dragger className="w-full h-56 mt-4">
                    <Flex justify="center" align="center" vertical>
                        <FileImageOutlined />
                        <Typography.Text className="ant-upload-text">
                            Click or drag file to this area to upload
                        </Typography.Text>
                    </Flex>
                </Upload.Dragger>
            </Flex>
        </Col>
        <Button type="primary" className=" mt-4 w-44 xs:block md:hidden" danger>
            Create Link
        </Button>
    </Row>
);
export default CreatePaymentLink;
