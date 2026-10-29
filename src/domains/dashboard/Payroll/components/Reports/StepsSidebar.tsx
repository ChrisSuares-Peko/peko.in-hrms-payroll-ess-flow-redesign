import React from 'react';

import { Flex, Typography } from 'antd';

interface Step {
    number: number;
    title: string;
    description: string;
}

interface StepsSidebarProps {
    steps: Step[];
}

const StepsSidebar: React.FC<StepsSidebarProps> = ({ steps }) => (
    <Flex vertical className="bg-white p-4 rounded border border-[#EAEAEA]">
        {steps.map(step => (
            <Flex key={step.number} gap={10} align="start" className="mb-4">
                <div className="flex items-center justify-center bg-red-500 text-white rounded-full w-6 h-6">
                    <Typography.Text className="text-white font-semibold">
                        {step.number}
                    </Typography.Text>
                </div>
                <div>
                    <Typography.Text className="font-medium text-[#1B1B1B]">
                        {step.title}
                    </Typography.Text>
                    <Typography.Paragraph className="text-gray-500 text-[0.85rem] m-0">
                        {step.description}
                    </Typography.Paragraph>
                </div>
            </Flex>
        ))}
    </Flex>
);

export default StepsSidebar;
