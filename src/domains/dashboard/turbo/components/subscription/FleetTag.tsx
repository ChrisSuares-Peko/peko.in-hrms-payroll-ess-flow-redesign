import React from 'react';

import { Tag } from 'antd';

interface FleetTagProps {
    count: number;
    onClick: () => void;
    selected: boolean;
}

const FleetTag: React.FC<FleetTagProps> = ({ count, onClick, selected }) => (
    <Tag
        onClick={onClick}
        style={{ borderRadius: '0.4rem', backgroundColor: 'white' }}
        className={`h-fit text-center p-2 text-sm items-center cursor-pointer xs:mt-1 md:mt-2 ${
            selected ? 'border border-red-500 bg-stone-50 text-red-500' : 'text-zinc-400'
        }`}
    >
        {`${count} Vehicles & Drivers`}
    </Tag>
);

export default FleetTag;
