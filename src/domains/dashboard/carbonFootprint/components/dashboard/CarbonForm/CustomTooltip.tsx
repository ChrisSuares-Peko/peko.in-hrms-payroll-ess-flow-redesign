import React from 'react';

import { TooltipProps } from 'recharts';

const CustomTooltip = ({ active, payload }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
        const value = payload[0].value.toFixed(2);
        return (
            <div className="p-2 bg-white border border-gray-300 rounded-md custom-tooltip">
                <p className="text-sm font-medium label">{`${value} CO₂`}</p>
            </div>
        );
    }

    return null;
};

export default CustomTooltip;
