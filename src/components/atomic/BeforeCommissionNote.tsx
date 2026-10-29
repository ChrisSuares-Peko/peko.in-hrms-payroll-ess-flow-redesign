import { Typography } from 'antd';

import { amountBeforeCommission, formatNumberWithLocalString } from '@utils/priceFormat';

type Props = {
    amount?: number | string | null;
    totalCommission?: number | string | null;
};

const BeforeCommissionNote = ({ amount, totalCommission }: Props) =>
    Number(totalCommission) > 0 ? (
        <Typography.Text type="secondary" className="text-xs">
            {`Before commission ₹ ${formatNumberWithLocalString(amountBeforeCommission(amount, totalCommission))}`}
        </Typography.Text>
    ) : null;

export default BeforeCommissionNote;
