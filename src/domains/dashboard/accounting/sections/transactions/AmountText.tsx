import { Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Transaction } from '../../utils/transactionsData';

const { Text } = Typography;

const AmountText = ({ amount, type }: Pick<Transaction, 'amount' | 'type'>) => {
    const isIncome = type === 'Income';
    return (
        <Text
            className="text-sm font-semibold md:text-base"
            style={{ color: isIncome ? '#43B75D' : '#FF4F4F' }}
        >
            {isIncome ? '+' : '-'}₹{formatNumberWithLocalString(amount)}
        </Text>
    );
};

export default AmountText;
