import { Col, Flex, Image, InputNumber, Row, Typography } from 'antd';

import { PlanCard } from './PlanCard';
import esimIcon from '../../assets/icons/esim.svg';
import useGetOrderDetails from '../../hooks/useGetPlans';

type CountryPlansBlockProps = {
    country: string;
    regionCode?: string;
    selectedPlan?: any;
    onSelectPlan: (country: string, plan: any) => void;
    quantity: number;
    onQuantityChange: (country: string, qty: number) => void;
};

export const CountryPlansBlock = ({
    country,
    regionCode,
    selectedPlan,
    onSelectPlan,
    quantity,
    onQuantityChange,
}: CountryPlansBlockProps) => {
    const { plans, isPlanLoading } = useGetOrderDetails(country, regionCode);

    if (isPlanLoading) {
        return (
            <div className="p-4 border rounded-xl">
                <Typography.Title level={5}>{country}</Typography.Title>
                <Typography.Text type="secondary">Loading plans...</Typography.Text>
            </div>
        );
    }

    if (!plans?.length) {
        return (
            <div className="p-4 border rounded-xl">
                <Typography.Title level={5}>{country}</Typography.Title>
                <Typography.Text type="secondary">No plans available</Typography.Text>
            </div>
        );
    }

    return (
        <div className="esim-country-plans-block">
            <Row gutter={[16, 16]}>
                {plans.map((plan, index) => (
                    <Col xs={24} sm={12} key={`${plan.planId}-${index}`}>
                        <PlanCard
                            plan={{
                                ...plan,
                                _index: index,
                                // isPopular: index === 1,
                            }}
                            selected={
                                selectedPlan?.planId === plan.planId &&
                                selectedPlan?._index === index
                            }
                            onSelect={() => onSelectPlan(country, { ...plan, _index: index })}
                        />
                    </Col>
                ))}
            </Row>

            <Flex vertical gap={10} className="mt-6 w-[170px]">
                <Flex align="center" gap={8}>
                    <Image src={esimIcon} alt="" preview={false} />
                    <Typography.Text className="text-sm font-medium">No. of eSIMs</Typography.Text>
                </Flex>

                <InputNumber
                    size="large"
                    className="w-full esim-quantity-input"
                    min={1}
                    max={50}
                    value={quantity}
                    placeholder="Enter"
                    onChange={value => onQuantityChange(country, value ? Math.round(value) : 1)}
                />
            </Flex>
        </div>
    );
};
