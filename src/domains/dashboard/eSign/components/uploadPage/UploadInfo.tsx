import type { FC } from 'react';

import { Card, Flex, Typography } from 'antd';

import FeatureCard from './FeatureCard';
import { eSignSteps } from '../../utils';

interface UploadInfoProps {}

const UploadInfo: FC<UploadInfoProps> = () => (
    <Card className="w-full h-full  rounded-[2rem]	border-gray-200	">
        <Flex gap={10} vertical className=" sm:px-6 sm:py-4">
            <Typography.Text className="  text-zinc-800 text-[1.3rem] sm:text-[1.7rem] font-semibold ">
                How do you eSign a Document?
            </Typography.Text>
            <Typography.Text className="text-neutral-600 text-sm ">
                You can easily eSign a document using Peko.
            </Typography.Text>
            <Flex className="mt-5" vertical gap={18}>
                {eSignSteps.map((feature, index) => (
                    <FeatureCard key={index} icon={feature.icon} text={feature.text} />
                ))}
            </Flex>
        </Flex>
    </Card>
);

export default UploadInfo;
