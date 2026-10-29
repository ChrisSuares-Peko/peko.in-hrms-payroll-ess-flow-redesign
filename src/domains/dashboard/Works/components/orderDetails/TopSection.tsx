import { Col, Flex, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Avatar } from '../../assets/icons/order-status';
import PlanSummaryCard from '../PlanSummaryCard';

function TopSection() {
    const orderDetails = useAppSelector(state => state.reducer.works.orderDetails);
    const { name, price, features } = orderDetails?.planDetails || {};

    const {
        emails = [],
        mobile,
        name: personName,
        showCRMDetails,
    } = orderDetails?.crmContactDetails || {};
    return (
        <Row gutter={[20, 20]} className=" pb-5">
            <PlanSummaryCard
                name={name ?? name}
                // description={description ?? description}
                // billingCycle={`/${billingCycle ?? billingCycle}`}
                price={`₹ ${formatNumberWithLocalString(price)}`}
                features={features ?? features}
            />
            {showCRMDetails !== 'NONE' && (
                <Col xs={24} md={14} lg={12}>
                    <Typography.Title level={5}>Your CRM Contact</Typography.Title>

                    <Flex align="start" gap={20} className="mt-5 flex-col xs375:flex-row">
                        <Flex>
                            <ReactSVG src={Avatar} />
                        </Flex>
                        <Flex vertical justify="space-between" gap={5} className="">
                            <Flex>
                                <Typography.Text className="text-lg font-normal">
                                    {personName}
                                </Typography.Text>
                            </Flex>
                            <Flex vertical gap={5} className="">
                                <Typography.Text className="text-lg font-normal text-neutral-400 ">
                                    {emails.join(', ')}
                                </Typography.Text>
                                <Typography.Text className="text-lg font-normal text-neutral-400">
                                    {mobile}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Flex>
                </Col>
            )}
        </Row>
    );
}

export default TopSection;
