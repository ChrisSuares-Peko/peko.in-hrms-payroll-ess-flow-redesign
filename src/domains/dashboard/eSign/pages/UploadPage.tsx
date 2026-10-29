import type { FC } from 'react';

import { Flex, Typography } from 'antd';

import SignDeskBranding from '../components/SignDeskBranding';
import UploadForm from '../components/uploadPage/UploadForm';
import UploadInfo from '../components/uploadPage/UploadInfo';

interface UploadPageProps {}

const UploadPage: FC<UploadPageProps> = () => (
    <Flex vertical>
        <SignDeskBranding className=" sm:-mt-9 md:-mt-16" />
        <Typography.Text className="font-medium text-lg sm:text-xl">
            Upload Document
        </Typography.Text>

        <Flex className="flex-col md:flex-row mt-8 gap-[2rem] sm:gap-[4rem]">
            <UploadForm eSignAvailable/>
            <UploadInfo />
        </Flex>
    </Flex>
);

export default UploadPage;
