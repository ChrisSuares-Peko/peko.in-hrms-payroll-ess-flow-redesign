import { TooltipProps } from 'recharts';

import { formatNumberWithLocalString } from '@utils/priceFormat';

const CustomTooltipMonthlyData = ({ active, payload }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white border border-gray-300 rounded-md custom-tooltip">
                <p className="text-sm font-medium labelText">{`Transactions : ${parseFloat(
                    parseFloat(payload[0].value).toFixed(2)
                )}`}</p>
                {payload[1] && (
                    <p className="text-sm font-medium labelText">{`Commission (excl. GST) : ₹ ${formatNumberWithLocalString(
                        payload[1].value
                    )}`}</p>
                )}
            </div>
        );
    }
    return null;
};

export default CustomTooltipMonthlyData;
