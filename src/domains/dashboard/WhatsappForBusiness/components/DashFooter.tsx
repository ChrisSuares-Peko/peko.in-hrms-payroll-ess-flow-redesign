import type { FC } from 'react';

import { Typography } from 'antd';
import { Flex } from 'antd/lib';

// import Aisensy from '@domains/dashboard/WhatsappForBusiness/assets/images/Aisensy.png';

const { Text } = Typography;

const DashFooter: FC = () => (
        <Flex className="mt-2 md:mt-8" justify="center" align="center" vertical>
            <Flex className="bg-[#F9F9F9] rounded-2xl py-4 md:px-10">
                <Text className="font-semibold text-center px-4 md:px-16 text-xl md:text-2xl">
                    WhatsApp Dashboard
                    <Text className="font-normal text-xl md:text-2xl">
                        {' '}
                        - Create your own message templates, manage WhatsApp campaigns, set up
                        automated chatbots, and monitor customer interactions.
                    </Text>
                </Text>
            </Flex>

            {/* <Flex vertical>
                <Flex justify="center" align="center">
                    <Text className="text-xs  mt-2 md:mt-8">Powered by</Text>
                </Flex>
                <Flex justify="center" align="center" className="mt-1">
                    <Image src={Aisensy} loading="lazy" preview={false} width={sm ? 150 : 120} />
                </Flex>
            </Flex> */}
        </Flex>
    );

export default DashFooter;
