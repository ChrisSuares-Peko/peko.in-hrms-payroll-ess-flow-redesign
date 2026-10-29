import { TooltipProps } from 'recharts';

import { formatNumberWithLocalString } from '@utils/priceFormat';

const CustomTooltipMonthlySharesData = ({ active, payload }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white border border-gray-300 rounded-md custom-tooltip">
                <p className="text-sm font-medium labelText">{`System Share (excl. GST) : ₹ ${formatNumberWithLocalString(
                    payload[0].value
                )}`}</p>
            </div>
        );
    }
    return null;
};

export default CustomTooltipMonthlySharesData;
