import { TooltipProps } from 'recharts';

import { formatNumberWithLocalString } from '@utils/priceFormat';

interface CustomTooltipProps extends TooltipProps<any, any> {
    labelText?: string;
}
const CustomTooltipMonthlyData = ({ active, payload, labelText = '₹' }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white border border-gray-300 rounded-md custom-tooltip">
                {/* <p className="text-sm font-medium labelText">{`Transactions : ${parseFloat(parseFloat(payload[0].value).toFixed(2))}`}</p> */}
                {/* <p className="text-sm font-medium labelText">{`Cashback : INR ${formatNumberWithLocalString(payload[1].value)}`}</p> */}
                {payload[0] && (
                    <p className="text-sm font-medium labelText">
                        {`Transactions : ${parseFloat(parseFloat(payload[0].value).toFixed(2))}`}
                    </p>
                )}

                {/* Conditionally render Cashback if payload[1] is present */}
                {payload[1] && (
                    <p className="text-sm font-medium labelText">
                        {`Commission (excl. GST) : ₹ ${formatNumberWithLocalString(payload[1].value)}`}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default CustomTooltipMonthlyData;
