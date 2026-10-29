import React from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import AndroidSVG from '../../assets/icons/android.svg';
import IphoneSVG from '../../assets/icons/iphone.svg';
import { androidInstallation, iosInstallation } from '../../utils/InstallationSteps';

type Props = {};

const Installation = (props: Props) => (
    <Flex gap={25} vertical>
        <Typography.Text className="text-xl font-medium text-textBlack mt-2">
            Installation Guideline:
        </Typography.Text>
        <Flex vertical gap={10} className="border rounded-lg p-6 mt-2">
            <ReactSVG className="mb-4" src={AndroidSVG} />
            {androidInstallation.map((item, i) => (
                <Typography.Text className="text-sm font-medium">
                    {`${i + 1}. ${item.title}:`}
                    <Typography.Text className="text-sm font-normal ms-2">
                        {item.content}
                    </Typography.Text>
                </Typography.Text>
            ))}

            <Typography.Text className="text-base font-semibold my-4">
                Please note that the specific steps may vary slightly depending on the Android
                device model and the network carrier.
            </Typography.Text>
        </Flex>
        <Flex vertical gap={10} className="border rounded-lg p-6">
            <ReactSVG className="mb-4" src={IphoneSVG} />
            {iosInstallation.map((item, i) => (
                <Typography.Text className="text-sm font-medium">
                    {`${i + 1}. ${item.title}`}
                    {i !== 0 && ':'}
                    <Typography.Text className="text-sm font-normal ms-2">
                        {i !== 0 && item.content}
                    </Typography.Text>
                </Typography.Text>
            ))}

            <Typography.Text className="text-base font-medium my-4">
                If you encounter any issues during the installation, you can reach out to your eSIM
                provider{`'`}s customer support for assistance.
            </Typography.Text>
        </Flex>
        <Typography.Text className="text-lg font-medium my-4 ms-1">
            Experience the future of mobile connectivity with eSIM
        </Typography.Text>
    </Flex>
);

export default Installation;
