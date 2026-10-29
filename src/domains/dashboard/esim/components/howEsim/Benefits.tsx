import React from 'react';

import { Flex, Typography } from 'antd';

type Props = {};

const Benefits = (props: Props) => {
    const BenefitsData = [
        {
            title: '1. Enhanced Connectivity:',
            description:
                'Seamlessly manage multiple mobile numbers on a single device, catering to various personal and professional needs.',
        },
        {
            title: '2. Effortless Mobility:',
            description:
                'Bid farewell to the hassles of swapping SIM cards. With eSIM, stay connected seamlessly during travel, ensuring uninterrupted communication wherever you are.',
        },
        {
            title: '3. Optimized Device Space:',
            description:
                ' By transitioning to eSIM, free up valuable space on your device for what matters most—be it your favourite apps, precious photos, or cherished memories.',
        },
    ];
    return (
        <Flex gap={10} vertical>
            <Typography.Text className="text-xl font-medium text-textBlack mt-2">
                Benefits of Switching to eSIM
            </Typography.Text>

            {BenefitsData.map((item, index) => (
                <Flex key={index} className="mt-2">
                    <Typography.Text className="text-sm font-medium">
                        {item.title}
                        <Typography.Text className="text-sm font-normal ms-2">
                            {item.description}
                        </Typography.Text>
                    </Typography.Text>
                </Flex>
            ))}
        </Flex>
    );
};

export default Benefits;
