import { Flex, Image, Typography } from 'antd';

import header from '@domains/dashboard/verificationSuite/assets/headerImage.png';


// import { paths } from '@src/routes/paths';

const HeaderBanner = () => {
    const { Text } = Typography;

    return (
        <Flex vertical className="mt-10">
            <Flex
                className="px-4 py-4 mb-5 sm:px-8 md:px-14 lg:px-16 sm:py-5 md:py-7 verification-gradient rounded-2xl"
                justify="space-between"
                align="center"
            >
                <Flex vertical className="w-full sm:w-full lg:w-2/3 xl:w-2/3">
                    <Text
                        className="text-sm sm:text-lg lg:text-2xl xxl:text-2xl font-medium "
                        style={{ lineHeight: '2' }}
                    >
                        One Click Instant Verification. Operate with Trust.
                    </Text>
                    <Text className="text-sm xs:hidden sm:block " style={{ lineHeight: '2' }}>
                        At Peko, we understand the critical importance of trust and compliance in
                        today&apos;s business landscape. Our comprehensive suite of verification
                        services is designed to ensure that your business operations are secure,
                        compliant, and efficient. Explore our offerings below.
                    </Text>
                </Flex>
                <Image
                    src={header}
                    preview={false}
                    className="w-full  h-auto sm:w-auto xs:max-h-28 md:max-h-40"
                />
            </Flex>
        </Flex>
    );
};

export default HeaderBanner;
