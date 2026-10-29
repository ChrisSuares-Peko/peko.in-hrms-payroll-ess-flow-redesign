import { TooltipProps } from 'recharts';

interface CustomTooltipProps extends TooltipProps<any, any> {
    labelText?: string;
}
const CustomTooltip = ({ active, payload, labelText = '₹' }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white border border-gray-300 rounded-md custom-tooltip">
                <p className="text-sm font-medium labelText">{`Corporates : ${payload[0].value}`}</p>
            </div>
        );
    }

    return null;
};

export default CustomTooltip;
