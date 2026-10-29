import { useEffect } from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { BBPSCategoryName } from '@customtypes/general';
import BharathConnect from '@src/domains/dashboard/billPayments/assets/svg/BharatConnect.svg';

import BeneficiariesList from '../components/BeneficiariesList';
import FormDetails from '../components/forms/DetailPageForm';
import { BILL_VIEWED_EVENT_MAP } from '../hooks/useFetchBillApi';

const { Text } = Typography;

interface Props {
    title: string;
    accessKeyName: string;
    serviceCategory: BBPSCategoryName;
}

const BillPaymentPage: React.FC<Props> = ({ title, accessKeyName, serviceCategory }: Props) => {
    useEffect(() => {
        // One "_clicked" event per utility sub-service, fired when its page is reached — same
        // idea as prepaid_started/postpaid_started, generalised across every service that goes
        // through this shared page. Reuses BILL_VIEWED_EVENT_MAP's per-service prefix (e.g.
        // "electricity_bill_viewed") so the two event families never drift apart.
        if (typeof Moengage?.track_event === 'function') {
            const viewedEvent = BILL_VIEWED_EVENT_MAP[accessKeyName];
            const clickedEvent = viewedEvent?.replace(/_viewed$/, '_clicked');
            if (clickedEvent) {
                Moengage.track_event(clickedEvent);
            }
        }
    }, [accessKeyName]);

    return (
        <Row>
            <Col xl={24}>
                <Flex justify="space-between">
                    <Text className="font-medium text-lg sm:text-xl">{title}</Text>
                    <Flex vertical gap={15}>
                        <ReactSVG
                            className="ml-16"
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
                    <FormDetails serviceCategory={serviceCategory} accessKeyName={accessKeyName} />
                </Flex>
            </Col>
            <Col
                xl={{ span: 9, offset: 2 }}
                className="w-full sm:bg-gray-50 rounded-3xl sm:p-6 mt-10 sm:mt-5 xl:mt-5"
            >
                <BeneficiariesList accessKeyName={accessKeyName} />
            </Col>
        </Row>
    );
};

export default BillPaymentPage;
