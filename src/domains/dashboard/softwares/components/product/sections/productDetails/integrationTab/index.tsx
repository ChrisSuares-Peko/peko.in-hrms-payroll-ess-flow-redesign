import { Col, Flex, Row, Typography, Image, Skeleton, Empty } from 'antd';
import { Link } from 'react-router-dom';

import defaultProductIntegrationImage from '@src/domains/dashboard/softwares/assets/images/defaultProductIntegrationImage.svg';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

const { Text } = Typography;

const IntegrationsTab = () => {
    const { product, isLoading } = useProductContext();

    if (isLoading) return <Skeleton />;
    if (!product) return null;

    const { integrations } = product;
    return (
        <Flex vertical className="w-full gap-3 min-h-96">
            <Text className="mt-7 font-semibold text-xl text-[#0A0A0A]">Available Integration</Text>

            <Row gutter={[20, 20]}>
                {!integrations || integrations.length === 0 ? (
                    <Flex className="w-full h-96 justify-center items-center">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </Flex>
                ) : (
                    integrations.map(integration => (
                        <Col
                            key={integration.id || integration.name}
                            sm={24}
                            md={24}
                            lg={12}
                            xxl={8}
                        >
                            <Flex
                                vertical
                                className="justify-center items-start border border-[#DAE0E5] rounded-2xl p-6 min-w-0"
                            >
                                <Image
                                    preview={false}
                                    src={integration.logo || defaultProductIntegrationImage}
                                    fallback={defaultProductIntegrationImage}
                                    width={40}
                                    height={40}
                                    alt={integration.name}
                                />

                                <Text className="text-xl xxl:text-base font-semibold">
                                    {integration.name}
                                </Text>

                                <Link
                                    to={integration.website}
                                    className="text-xs font-normal !text-[#667085] w-full truncate"
                                >
                                    {integration.website}
                                </Link>
                            </Flex>
                        </Col>
                    ))
                )}
            </Row>
        </Flex>
    );
};

export default IntegrationsTab;
