import { Col, Flex, Typography, Button } from 'antd';
// import clevertap from 'clevertap-web-sdk';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import worksPlanList from '@src/domains/dashboard/Works/assets/svg/worksPlanList.svg';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { resetFormData } from '../slices/worksSlice';

type Props = {
    feature: string;
    planName: string;
    price: string;
    billingCycle: string;
    description: string;
    planId: number;
    workId: string | undefined;
    isPopular?: boolean;
};

const PlanCard = ({
    isPopular,
    price,
    planName,
    billingCycle,
    description,
    feature,
    workId,
    planId,
}: Props) => {
    const dispatch = useAppDispatch();
    const data = feature?.split('\n');
    const discountPercentage = 0;
    const isFeaturesValid = Array.isArray(data) && data.length > 0;
    return (
        <Col xs={24} sm={12} md={12} lg={12} xl={8}>
            <Flex className="h-full flex-col justify-between rounded-2xl border transition duration-150 transform hover:scale-105 shadow-lg">
                <Flex className="h-full w-full md:p-8 p-6" gap={10} vertical>
                    {discountPercentage && discountPercentage > 0 ? (
                        <Typography.Text
                            className=" px-4 py-1  Typography.text-[#363835] rounded-2xl bg-[#DBFFC5]"
                            style={{ fontSize: '11px' }}
                        >
                            Save upto {discountPercentage}%
                        </Typography.Text>
                    ) : (
                        ''
                    )}

                    <Flex align="center">
                        <Typography.Text className="text-[.7rem] md:text-[.9rem] font-medium">
                            {planName}
                        </Typography.Text>
                        {/* <Typography.Text className="text-xs font-normal ml-2">
                            /{billingCycle.toLowerCase() === 'monthly' ? 'Month' : 'Year'}
                        </Typography.Text> */}
                    </Flex>
                    <Typography.Text className=" text-2xl font-medium text-[1.8rem]">
                        ₹ {price}
                    </Typography.Text>
                    <Flex vertical justify="space-between" className="h-full">
                        <Flex vertical gap={8}>
                            {isFeaturesValid &&
                                data?.map((value, index) => (
                                    <Flex vertical key={index}>
                                        {value !== '' && (
                                            <Flex gap={8}>
                                                <ReactSVG src={worksPlanList} />
                                                <Typography.Text className="text-xs font-normal">
                                                    {value}
                                                </Typography.Text>
                                            </Flex>
                                        )}
                                    </Flex>
                                ))}
                        </Flex>
                        <Flex>
                            <Link
                                to={`/${paths.dashboard.works}/${paths.works.detail}/${workId}/${paths.works.purchase}/${planId}`}
                                className="w-full"
                                onClick={() => {
                                    dispatch(resetFormData());
                                    // clevertap.event.push('works_choose_plan', {
                                    //     name: planName?.split(' ')?.join('_')?.toLowerCase(),
                                    // });
                                    // clevertap.event.push('works_purchase_click', {
                                    //     click: true,
                                    // });
                                }}
                            >
                                <Button className="mt-4 w-full" type="default" danger>
                                    Purchase
                                </Button>
                            </Link>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Col>
    );
};

export default PlanCard;
