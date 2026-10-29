import { Col, Row, Typography } from 'antd';

const RequestHeader = () => (
    <Row>
        <Col span={24}>
            <Typography.Paragraph
                className=" text-lg font-medium  "
                style={{ paddingLeft: '.625rem' }}
            >
                Paytm Billing Software
            </Typography.Paragraph>
        </Col>

        <Col span={24}>
            <Typography.Paragraph
                className="text-gray-500  text-base font-light "
                style={{ paddingLeft: '.625rem' }}
            >
                A software driven by data for 360° Store Management
            </Typography.Paragraph>
        </Col>
    </Row>
);

export default RequestHeader;
