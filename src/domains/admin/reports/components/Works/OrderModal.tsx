import { Button, Drawer, Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    handleRefresh: () => void;
};

const OrderUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const orderResponse = JSON.parse(data.order.orderResponse);
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
                        Work Name:
                    </Typography.Text>
                    <Typography.Text>
                        {orderResponse?.planDetails?.work?.name || '-'}
                    </Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Customer Name:
                    </Typography.Text>
                    <Typography.Text>{data?.credential?.name || '-'}</Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Order ID:
                    </Typography.Text>
                    <Typography.Text>{data?.order?.corporateTxnId || '-'}</Typography.Text>
                </Flex>

                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Amount:
                    </Typography.Text>
                    <Typography.Text>
                        ₹ {formatNumberWithLocalString(data?.order?.amountInINR)}
                    </Typography.Text>
                </Flex>
                <Flex className="pt-2 border-t">
                    <Typography.Text className="pb-1 text-lg font-medium">
                        POC Information
                    </Typography.Text>
                </Flex>

                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        POC Name:
                    </Typography.Text>
                    <Typography.Text>{orderResponse?.pocName || '-'}</Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        POC Email:
                    </Typography.Text>
                    <Typography.Text>{orderResponse?.email || '-'}</Typography.Text>
                </Flex>
                <Flex vertical className="mb-3">
                    <Typography.Text className="pb-1 text-base font-medium">
                        Requirement:
                    </Typography.Text>
                    <Typography.Text>{orderResponse?.requirement || '-'}</Typography.Text>
                </Flex>
            </Flex>
        </Drawer>
    );
};

export default OrderUpdateModal;
