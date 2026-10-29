import { Button, Drawer, Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    handleRefresh: () => void;
};

const OrderUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const orderResponse = JSON.parse(data.orderResponse);
    return (
        <Drawer
            title="Work Order Details"
            open={open}
            onClose={() => {
                handleCancel();
            }}
            closeIcon={null}
            width={470}
            styles={{
                body: { paddingInline: 20, paddingBlock: 16 },
                header: { paddingInline: 20 },
            }}
            zIndex={20}
            footer={[
                <Flex className="w-full " justify="flex-end" gap={10} key="">
                    <Button
                        key="back"
                        onClick={() => {
                            handleCancel();
                        }}
                        className="px-5"
                    >
                        Cancel
                    </Button>
                </Flex>,
            ]}
        >
            <Flex vertical className="w-full ">
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Plan Name:
                    </Typography.Text>
                    <Typography.Text>{orderResponse.planDetails.name}</Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Customer Name:
                    </Typography.Text>
                    <Typography.Text>{data?.credential.name}</Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Transaction ID:
                    </Typography.Text>
                    <Typography.Text>{data?.corporateTxnId}</Typography.Text>
                </Flex>

                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Amount:
                    </Typography.Text>
                    <Typography.Text>
                        {formatNumberWithLocalString(Number(data?.amountInINR))}
                    </Typography.Text>
                </Flex>
                <Flex className="pt-2 border-t">
                    <Typography.Text className="pb-1 text-lg font-medium">
                        POC Information
                    </Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Billing Cycle:
                    </Typography.Text>
                    <Typography.Text>{orderResponse?.planDetails.billingCycle}</Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Description:
                    </Typography.Text>
                    <Typography.Text>{orderResponse?.planDetails.description}</Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Highlights:
                    </Typography.Text>
                    <Typography.Text>{orderResponse?.planDetails.highlights}</Typography.Text>
                </Flex>
            </Flex>
        </Drawer>
    );
};

export default OrderUpdateModal;
