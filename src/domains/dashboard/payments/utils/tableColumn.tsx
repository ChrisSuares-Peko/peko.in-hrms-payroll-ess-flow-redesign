import { TableProps, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
export const BulkUploadColumn = (): TableProps<any>['columns'] => [
    {
        title: 'Transaction ID',
        dataIndex: 'corporateTxnId',
        key: 'corporateTxnId',
    },
    // {
    //     title: 'Account Number',
    //     dataIndex: 'account',
    //     key: 'account',
    // },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: amount => `₹ ${formatNumberWithLocalString(amount)}`,
    },
    {
        title: 'Platform fee',
        dataIndex: 'surcharge',
        key: 'surcharge',
        render: surcharge => `₹ ${formatNumberWithLocalString(surcharge)}`,
    },
    {
        title: 'Status',
        dataIndex: 'paymentStatus',
        key: 'paymentStatus',
        render: status => {
            let colorClass = '';
            if (status === 'SUCCESS') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'PROCESSING') {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            } else if (status === 'FAILURE') {
                colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
            }
            const formattedStatus = formatText(status);
            return (
                <Typography.Text className={`${colorClass} font-normal px-3 py-1 rounded-2xl`}>
                    {formattedStatus}
                </Typography.Text>
            );
        },
    },
];
