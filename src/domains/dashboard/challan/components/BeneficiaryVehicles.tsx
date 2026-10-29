/* eslint-disable no-nested-ternary */
import { Button, Empty, Flex, Skeleton, Typography } from 'antd';

import carSideSvg from '../assets/svg/carSide.svg';
import { ChallanBeneficiary } from '../types/index';

const { Text } = Typography;

interface Props {
    beneficiaries: ChallanBeneficiary[];
    isLoading?: boolean;
    onFetch: (vehicleNumber: string) => void;
    onAdd: () => void;
    onEdit: (beneficiary: ChallanBeneficiary) => void;
}

const BeneficiaryVehicles = ({ beneficiaries, isLoading, onFetch, onAdd, onEdit }: Props) => (
    <>
        <Flex className="h-9 w-full" justify="space-between" align="center">
            <Text className="text-lg font-medium sm:text-lg">Your Beneficiaries</Text>
            <Button danger onClick={onAdd} className="h-full text-xs sm:px-5 sm:text-sm">
                Add Beneficiary
            </Button>
        </Flex>

        <Flex vertical className="mt-7 w-full gap-6 sm:h-[42rem] sm:overflow-y-auto">
            {isLoading ? (
                [...Array(5)].map((_, index) => <Skeleton key={index} active />)
            ) : beneficiaries.length > 0 ? (
                beneficiaries.map(b => (
                    <Flex
                        key={b.id}
                        vertical
                        gap={10}
                        className="rounded-2xl border border-[#EFF1F4] bg-white p-4"
                    >
                        <Flex justify="space-between" align="center">
                            <Text className="text-sm text-[#486284]">{b.nickname}</Text>
                            <Text
                                className="cursor-pointer text-sm text-[#FF4F4F]"
                                onClick={() => onEdit(b)}
                            >
                                Edit
                            </Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                            <Flex gap={10} align="center">
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="rounded-lg bg-[#FFF6F2]"
                                    style={{ width: 36, height: 36 }}
                                >
                                    <img src={carSideSvg} alt="" style={{ width: 22, height: 22 }} />
                                </Flex>
                                <Flex vertical>
                                    <Text className="font-medium text-[#1E293B]">
                                        {b.vehicleNumber}
                                    </Text>
                                    <Text className="text-xs text-[#868686]">Traffic Challan</Text>
                                </Flex>
                            </Flex>
                            <Button
                                type="primary"
                                size="small"
                                className="!rounded-lg !px-5 !bg-[#FF4F4F] hover:!bg-[#E84545]"
                                onClick={() => onFetch(b.vehicleNumber)}
                            >
                                Fetch Challans
                            </Button>
                        </Flex>
                    </Flex>
                ))
            ) : (
                <Flex className="h-full" justify="center" align="center">
                    <Empty
                        description={
                            <Text className="px-0 text-gray-400 sm:px-10">
                                No Beneficiaries Found.
                            </Text>
                        }
                    />
                </Flex>
            )}
        </Flex>
    </>
);

export default BeneficiaryVehicles;
