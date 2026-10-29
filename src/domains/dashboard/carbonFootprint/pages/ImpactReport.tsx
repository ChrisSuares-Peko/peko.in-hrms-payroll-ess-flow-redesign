import { Col, Flex, Row, Typography } from 'antd';

import CardRow from '../components/CardRow';
import SocialLinks from '../components/SocialLinks';
import { data } from '../utils/impactReport/data';

const { Text } = Typography;

const ImpactReport = () => (
    <Row className="mt-10">
        <Col xs={24} md={24}>
            <Flex gap={45} align="center" vertical>
                <Text className="text-3xl font-light ">You have made a great Impact</Text>
                <Text className="text-4xl -mt-6">By neutralising 1 carbon credit</Text>
                <Text className="text-xl font-normal -mt-6">Your action equals to</Text>
            </Flex>
        </Col>
        <Col className="mt-10 md:px-20" xs={24} md={24}>
            <CardRow data={data} />
        </Col>
        <Col className="mt-10 " xs={24} md={24}>
            <Flex justify="center" gap="large" className="mt-8">
                <Text className="text-2xl">Let’s keep doing the great work</Text>
            </Flex>
        </Col>
        {/* <Col className="mt-10" xs={24} md={24}>
            <Flex justify="center" gap={30}>
                <Row gutter={[20, 20]}>
                    <Col xs={12}>
                        <Card
                            size="small"
                            className="min-h-30 md:min-w-52 border border-1 p-3 rounded-xl"
                            bordered={false}
                        >
                            <Flex
                                justify="center"
                                align="center"
                                gap="middle"
                                className="mt-6"
                                vertical
                            >
                                <ReactSVG src={PdfSVG} />
                                <Text className="text-sm text-center">
                                    Download your <br /> impact reports in pdf
                                </Text>
                                <Button danger type="default" className="px-10">
                                    Download
                                </Button>
                            </Flex>
                        </Card>
                    </Col>
                    <Col xs={12}>
                        <Card
                            size="small"
                            className="min-h-30 border border-1 md:min-w-52 p-3  rounded-xl"
                            bordered={false}
                        >
                            <Flex
                                justify="center"
                                align="center"
                                gap="middle"
                                className="mt-6"
                                vertical
                            >
                                <ReactSVG src={CertificateSVG} />
                                <Text className="text-sm text-center">
                                    Download your <br /> certificate
                                </Text>
                                <Button danger type="default" className=" px-10">
                                    Download
                                </Button>
                            </Flex>
                        </Card>
                    </Col>
                </Row>
            </Flex>
        </Col> */}
        <Col className="mt-6 " xs={24} md={24}>
            <Flex justify="center" align="center" gap="large" vertical>
                <Text className="text-2xl text-green-900">Share your impact</Text>
                <SocialLinks />
            </Flex>
        </Col>
    </Row>
);
export default ImpactReport;
