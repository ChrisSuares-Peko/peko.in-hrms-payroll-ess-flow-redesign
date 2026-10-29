import { Divider, Flex, Progress, Rate, Skeleton, Typography } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

const { Text } = Typography;

const RatingAndReviewSection = () => {
    const { product, isLoading, ratingFactorsList } = useProductContext();

    if (isLoading) return <Skeleton />;
    if (!product) return null;

    return (
        <Flex vertical className="w-full gap-3">
            <Text className="mt-7 font-semibold text-xl text-[#0A0A0A]">Rating Overview</Text>

            <Flex
                className="flex-col xl:flex-row items-start xl:items-center 
                           w-full p-6 bg-[#F9FAFB] rounded-3xl 
                           gap-6 xl:gap-10"
            >
                {/* LEFT SIDE */}
                <Flex vertical className="gap-2 w-full xl:w-auto xl:min-w-[220px]">
                    <Text className="font-normal text-center xl:text-left text-sm text-[#4A5565]">
                        Overall Rating
                    </Text>

                    <Flex className="justify-center xl:justify-start items-center gap-3">
                        <Text className="font-bold text-3xl">
                            {Number(product.ratings.overall_rating).toFixed(1)}
                        </Text>

                        <Rate
                            allowHalf
                            value={Number(product.ratings.overall_rating)}
                            className="text-lg text-[#FFA432]"
                        />
                    </Flex>

                    <Text className="text-center xl:text-left font-normal text-sm text-[#4A5565]">
                        Based on {product.ratings.total_reviews} reviews
                    </Text>
                </Flex>

                <Divider className="xl:hidden" />

                {/* RIGHT SIDE */}
                <Flex vertical className="w-full xl:flex-1 gap-4">
                    {ratingFactorsList?.map(el => (
                        <Flex
                            key={el.key}
                            className="flex-col xl:flex-row items-center xl:items-center gap-3"
                        >
                            {/* LABEL */}
                            <Text className="w-full xl:w-[35%] text-center xl:text-left">
                                {el.label}
                            </Text>

                            {/* MOBILE */}
                            <Flex className="w-full xl:hidden">
                                <Progress
                                    className="w-[70%]"
                                    percent={(el.value / 5) * 100}
                                    showInfo={false}
                                    strokeColor="#FFA432"
                                />
                                <Text className="w-[20%] text-right">
                                    {Number(el.value).toFixed(1)}
                                </Text>
                            </Flex>

                            <Divider className="xl:hidden" />

                            {/* XL  */}
                            <Progress
                                className="hidden xl:inline-flex xl:w-[50%]"
                                percent={(el.value / 5) * 100}
                                showInfo={false}
                                strokeColor="#FFA432"
                            />

                            <Text className="hidden xl:inline w-[10%] text-right">
                                {Number(el.value).toFixed(1)}
                            </Text>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Flex>
    );
};

export default RatingAndReviewSection;
