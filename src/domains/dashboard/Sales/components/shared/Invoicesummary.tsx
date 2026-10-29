import { Flex, Typography } from 'antd';

import LeftHeader from './LeftHeader';

function Invoicesummary({
    title,
    description,
    customerName,
    invoiceNo,
    amount,
}: {
    title: string;
    description: string;
    customerName: string;
    invoiceNo: string;
    amount: number | string;
}) {
    return (
        <>
            <LeftHeader title={title} description={description} />
            <Flex
                justify="space-between"
                align="center"
                className="bg-[#F8FAFC] rounded-2xl px-5 py-3 my-2"
            >
                <Flex vertical gap={4}>
                    <Typography.Text className="text-base font-semibold">
                        {customerName}
                    </Typography.Text>
                    <Typography.Text className="text-[#475569] text-xs font-normal">
                        {invoiceNo}
                    </Typography.Text>
                </Flex>
                <Typography.Text className="text-green-700 text-base font-semibold">
                    ₹{amount?.toLocaleString('en-IN')}
                </Typography.Text>
            </Flex>
        </>
    );
}

export default Invoicesummary;
