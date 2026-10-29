import { Col, Flex, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import BharathConnect from '@src/domains/dashboard/billPayments/assets/svg/BharatConnect.svg';
import { accessKeys } from '@utils/accessKeys';

import BeneficiariesList from '../components/BeneficiariesList';
import TestForm from '../components/forms/TestForm';

const { Text } = Typography;

const Postpaid: React.FC = () => {
    const accessKey = accessKeys.test;

    return (
        <Row>
            <Col xl={24}>
                <Flex justify="space-between">
                    <Text className="font-medium text-lg sm:text-xl">Test</Text>
                    <Flex vertical gap={15}>
                        <ReactSVG
                            className="ml-12"
                            src={BharathConnect}
                            beforeInjection={svg => {
                                svg.setAttribute('style', 'width: 85px; height: 40px;');
                            }}
                        />
                    </Flex>
                </Flex>
            </Col>
            <Col xl={13} className="w-full xl:sticky xl:top-0 h-fit mt-5">
                <Flex vertical gap={30}>
                    {/* <Flex align="center" justify="space-between">
                        <Text className="text-lg font-medium">Mobile Postpaid</Text>
                        <Image
                            src={bbpsLogo}
                            loading="eager"
                            width={70}
                            preview={false}
                            alt="icon"
                        />
                    </Flex> */}
                    <TestForm />
                </Flex>
            </Col>
            <Col
                xl={{ span: 9, offset: 2 }}
                className="w-full sm:bg-gray-50 rounded-3xl sm:p-6 mt-10 sm:mt-5 xl:mt-5"
            >
                <BeneficiariesList accessKeyName={accessKey} />
            </Col>
        </Row>
    );
};

export default Postpaid;
