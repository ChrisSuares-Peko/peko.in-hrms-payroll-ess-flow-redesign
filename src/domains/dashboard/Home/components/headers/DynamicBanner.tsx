/* eslint-disable react/no-danger */
import { Button, Flex, Image, Typography } from 'antd';
import DOMPurify from 'dompurify';

import useScreenSize from '@src/hooks/useScreenSize';

const DynamicBanner = ({
    data,
    handleButtonClick,
}: {
    data: any;
    handleButtonClick: () => void;
}) => {
    const { Text } = Typography;
    const { sm } = useScreenSize();

    return (
        <Flex
            className="px-4 py-4 mb-5 sm:px-10 sm:py-7 banner-gradient rounded-2xl"
            justify="space-between"
            align="center"
        >
            <Flex vertical gap={sm ? 16 : 10}>
                <Text className="text-base font-medium xxl:text-xl">{data?.[0]?.bannerTitle}</Text>
                <div
                    className="max-w-xl text-[0.65rem] font-normal sm:text-xs xxl:max-w-lg"
                    style={{ lineHeight: sm ? '1.4rem' : '1.1rem' }}
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(data?.[0]?.description || ''),
                    }}
                />
                <Button
                    onClick={handleButtonClick}
                    danger
                    size={sm ? 'middle' : 'small'}
                    type="primary"
                    className="w-24 text-xs font-normal sm:text-base sm:font-medium sm:w-32"
                >
                    {data?.[0]?.buttonText || 'Shop Now'}
                </Button>
            </Flex>
            <Image
                src={data?.[0]?.bannerImage}
                preview={false}
                style={{ width: '100%', height: '100%', maxHeight: '9rem' }}
            />
        </Flex>
    );
};

export default DynamicBanner;
