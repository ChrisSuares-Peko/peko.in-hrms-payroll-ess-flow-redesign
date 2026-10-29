import { Button, Flex, Image, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import banner from '../assets/bannerimg.png';
import minus from '../assets/minus.svg';
// import { paths } from '@src/routes/paths';

const HeaderBanner = () => {
    const { Text } = Typography;
    const { sm } = useScreenSize();
    const dispatch = useAppDispatch();

    const handleClick = () => {
        dispatch(
            showToast({
                description: 'Coming Soon',
                variant: 'info',
            })
        );
    };
    return (
        <Flex vertical className="mt-5 md:px-16 lg:px-24 xl:px-36">
            <Flex
                className="px-4 py-4 mb-5 sm:px-8 md:px-14 lg:px-16 sm:py-5 md:py-7 hike-gradient rounded-2xl"
                justify="space-between"
                align="center"
            >
                <Flex vertical className="w-full sm:w-3/4 lg:w-2/3 xl:w-1/2">
                    <Text
                        className="text-sm sm:text-lg lg:text-xl xxl:text-2xl"
                        style={{ lineHeight: '2' }}
                    >
                        Build a world-class work culture that accelerates your organization’s growth
                    </Text>
                </Flex>
                <Image
                    src={banner}
                    preview={false}
                    className="w-full h-auto sm:w-auto sm:max-h-32 md:max-h-40"
                />
            </Flex>
            <Flex
                gap={sm ? 16 : 10}
                align="center"
                justify="center"
                className="flex-col mt-4 sm:flex-row "
            >
                <Text className="text-base font-medium xxl:text-xl">We offer</Text>
                <Button
                    danger
                    type="default"
                    className="w-40 text-xs font-normal sm:text-base sm:font-medium "
                >
                    <Flex gap={4} onClick={handleClick}>
                        <ReactSVG src={minus} />
                        <Text className="text-sm text-bgOrange2 ">Health Insurance</Text>

                        {/* <ReactSVG src={arrow} className='mt-1'/> */}
                    </Flex>
                </Button>
                <Text className="text-base font-medium xxl:text-xl">& Rewards through Hike</Text>
            </Flex>
        </Flex>
    );
};

export default HeaderBanner;
