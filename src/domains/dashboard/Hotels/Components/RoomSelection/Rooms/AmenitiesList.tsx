import { useState } from 'react';

import { Flex, Typography } from 'antd';

const AMENITIES_VISIBLE_COUNT = 3;

interface AmenityItem {
    text: string;
    icon: React.ReactNode;
}

const AmenitiesList = ({ items }: { items: AmenityItem[] }) => {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? items : items.slice(0, AMENITIES_VISIBLE_COUNT);

    return (
        <Flex vertical gap={10} className="w-full">
            <Typography.Text className="text-xs font-medium text-slate-800 opacity-60">
                Included Amenities
            </Typography.Text>
            <Flex vertical gap={8} className="w-full">
                {visible.map((item, index) => (
                    <Flex key={index} gap={8} align="center">
                        <span className="text-sm text-slate-500">{item.icon}</span>
                        <Typography.Text className="text-sm text-slate-600">
                            {item.text}
                        </Typography.Text>
                    </Flex>
                ))}
            </Flex>
            {items.length > AMENITIES_VISIBLE_COUNT && (
                <Typography.Text
                    className="text-sm text-slate-400 cursor-pointer"
                    onClick={() => setShowAll(v => !v)}
                >
                    {showAll ? 'view less...' : 'view more...'}
                </Typography.Text>
            )}
        </Flex>
    );
};

export default AmenitiesList;
