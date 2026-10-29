import { Button, Card, Flex, Input, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import useSearch from '../../../hooks/home/useSearch';

const { Paragraph, Text } = Typography;

const Hero = () => {
    const { searchText, handleSearch, getSearchResults } = useSearch();
    return (
        <Card className="w-full rounded-3xl mt-7 overflow-hidden bg-gradient-to-r from-[#FFF2F2] to-[#F0F5FA] border-0 shadow-none">
            <Flex
                vertical
                align="center"
                justify="center"
                className="w-full h-full gap-2 md:gap-4 sm:py-3 md:py-4 lg:py-5"
            >
                <Flex vertical align="center" className="w-full xl:w-[80%]  gap-2 ">
                    <Text className="text-xl sm:text-2xl md:text-4xl  font-semibold  text-[#1F1F1F] text-center ">
                        Find The Right Software For Your Business
                    </Text>
                    <Text className=" text-xs sm:text-sm xl:text-xl font-normal  text-center text-[#1F1F1FBF] opacity-75">
                        Discover, compare, and buy software trusted by SMBs
                    </Text>
                </Flex>

                <Flex
                    justify="flex-end"
                    className=" w-[70%] sm:w-[60%] lg:w-[50%]  ps-4 sm:ps-8  rounded-2xl border border-[#E4E6EF] bg-white shadow-sm"
                >
                    <Input
                        placeholder="Search for software..."
                        className="w-full text-xs md:text-base"
                        variant="borderless"
                        allowClear
                        type="text"
                        maxLength={100}
                        value={searchText}
                        onChange={handleSearch}
                        onPressEnter={getSearchResults}
                        suffix={
                            <Button
                                className="!flex !items-center !justify-center text-[.6rem] xs:text-xs md:text-base rounded-lg h-7 w-12 xs:w-14 md:h-12 md:w-36 shrink-0 leading-none"
                                type="primary"
                                danger
                                onClick={getSearchResults}
                            >
                                Search
                            </Button>
                        }
                    />
                </Flex>

                <Paragraph className="w-full sm:w-[80%] font-normal  text-sm sm:text-md text-center text-[#1F1F1F]">
                    Don’t know what you are looking for?{' '}
                    <Link
                        className="!text-[#FF4F4F]  sm:font-medium underline"
                        to={paths.softwares.findSoftware}
                    >
                        Click Here
                    </Link>
                </Paragraph>
            </Flex>
        </Card>
    );
};

export default Hero;
