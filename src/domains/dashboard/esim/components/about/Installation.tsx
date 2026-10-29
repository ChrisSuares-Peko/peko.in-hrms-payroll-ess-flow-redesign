import React from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import AndroidSVG from '../../assets/icons/android.svg';
import IosSVG from '../../assets/icons/ios.svg';
import { androidInstallation, iosInstallation } from '../../utils/InstallationSteps';

type Props = {};

const Installation = (props: Props) => (
    <Flex gap={25} vertical>
        <Flex vertical gap={10} className="border rounded-lg p-3 sm:p-6 mt-2">
            <ReactSVG className="mb-4" src={AndroidSVG} />
            {androidInstallation.map((item, i) => (
                <Typography.Text className="text-sm font-medium">
                    {`${i + 1}. ${item.title}:`}
                    <Typography.Text className="text-sm font-normal ms-2">
                        {item.content}
                    </Typography.Text>
                </Typography.Text>
            ))}

            <Typography.Text className="text-base font-medium my-4">
                Please note that the specific steps may vary slightly depending on the Android
                device model and the network carrier.
            </Typography.Text>
        </Flex>
        <Flex vertical gap={10} className="border rounded-lg p-3 sm:p-6">
            <ReactSVG className="mb-5" src={IosSVG} />
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
                If you encounter any issues during the installation, you can reach out to our
                support at
                <a
                    target="_blank"
                    rel="noreferrer"
                    href="mailto:reach@peko.one"
                    className="text-blue-600 underline ml-2"
                >
                    reach@peko.one
                </a>
            </Typography.Text>
        </Flex>
        <Typography.Text className="text-lg font-medium my-4 ms-1">
            Experience the future of mobile connectivity with eSIM
        </Typography.Text>
    </Flex>
);

export default Installation;
