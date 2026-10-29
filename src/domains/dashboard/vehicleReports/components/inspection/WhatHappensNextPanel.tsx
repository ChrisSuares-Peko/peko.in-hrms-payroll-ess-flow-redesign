import { Flex, Typography } from 'antd';

import { inspectionNextSteps } from '../../utils/data';

const { Text } = Typography;

// Numbered "What Happens Next" panel on the inspection booking summary rail.
const WhatHappensNextPanel = () => (
    <Flex vertical gap={12} className="rounded-xl bg-[#F7F8FA] p-4">
        <Text className="text-sm font-medium text-[#0A0A0A]">What Happens Next</Text>
        {inspectionNextSteps.map((step, index) => (
            <Flex key={step} align="center" gap={10}>
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#E4E7EC] text-[10px] text-[#475569]">
                    {index + 1}
                </span>
                <Text className="text-sm text-[#42526D]">{step}</Text>
            </Flex>
        ))}
    </Flex>
);

export default WhatHappensNextPanel;
