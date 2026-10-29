import { Button, Card, Flex, Image, Typography } from 'antd';

import { accessKeys } from '@utils/accessKeys';

import BbpsPlanDrawer from './BbpsPlanDrawer';
import useFetchBillApi from '../hooks/useFetchBillApi';
import { Beneficiary } from '../types/index';
import { billPayments, telecomServices } from '../utils/data';

interface BeneficiaryCardProps {
    beneficiary: Beneficiary;
    handleEdit?: () => void;
}
const { Text } = Typography;

const allServices = [...billPayments, ...telecomServices];

const BeneficiaryCard = ({ beneficiary, handleEdit }: BeneficiaryCardProps) => {
    const {
        handleBeneficiaryPayment,
        isLoading,
        billerPlans,
        isPlanDrawerOpen,
        setIsPlanDrawerOpen,
        handlePlanSelect,
    } = useFetchBillApi();
    const service = allServices.find(
        s =>
            s.accessKey === beneficiary?.accessKey ||
            s.title === beneficiary?.serviceOperator?.serviceProvider
    );
    // Prefer our local service icon; fall back to the API-provided image
    const serviceImage = service?.icon || beneficiary?.serviceOperator?.serviceImage;
    // Traffic Challan rows hold a vehicle number, not a BBPS biller: show the service name in place
    // of the (empty) provider, and the action fetches that vehicle's challans instead of paying a bill.
    const isChallan = beneficiary?.accessKey === accessKeys.challan;
    const cardTitle = isChallan ? service?.title : beneficiary?.serviceOperator?.serviceProvider;
    const identifier = () => {
        if (!beneficiary?.customerParams?.length) return 'No Data';
        const value = beneficiary.customerParams[0]?.value;
        return isChallan ? value : `${value} (${beneficiary?.serviceProvider})`;
    };
    const handlePayNow = () => {
        handleBeneficiaryPayment(beneficiary);
    };
    return (
        <>
            <BbpsPlanDrawer
                open={isPlanDrawerOpen}
                plans={billerPlans}
                onClose={() => setIsPlanDrawerOpen(false)}
                onSelectPlan={handlePlanSelect}
            />
            <Card
                size="small"
                className="sm:rounded-xl"
                title={<Text className="text-sm font-normal text-cardHTitleText">{cardTitle}</Text>}
                extra={
                    <Text onClick={handleEdit} className="px-3 cursor-pointer text-bgOrange2">
                        Edit
                    </Text>
                }
            >
                <Flex className="w-full px-2 " align="center" justify="space-between">
                    <Flex align="center" gap={12} className="w-full">
                        <div>
                            <Image src={serviceImage} preview={false} width={35} height={35} />
                        </div>
                        <Flex vertical gap={4}>
                            <Text className="text-xs font-normal ">{beneficiary?.name}</Text>
                            <Text className="text-xs font-normal text-black/45">
                                {identifier()}
                            </Text>
                        </Flex>
                    </Flex>
                    <Button
                        type="primary"
                        className="text-xs sm:text-sm"
                        danger
                        onClick={handlePayNow}
                        loading={isLoading}
                    >
                        {isChallan ? 'Fetch Challans' : 'Pay Now'}
                    </Button>
                </Flex>
            </Card>
        </>
    );
};

export default BeneficiaryCard;
