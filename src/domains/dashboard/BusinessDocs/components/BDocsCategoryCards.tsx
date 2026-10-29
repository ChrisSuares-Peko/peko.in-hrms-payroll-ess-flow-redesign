import React from 'react';

import { Card, Flex, Image, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { categoryCard } from '../types/type';

const { Text } = Typography;

function BDocsCategoryCards({ icon, category, size, loading }: categoryCard) {
    return (
        <Link to={paths.businessDocs.category} state={{ category }}>
            <Card bordered loading={loading} className="border rounded-xl ">
                <Flex
                    className="w-full justify-center xs:items-center sm:items-start"
                    vertical
                    gap={9}
                >
                    <Flex
                        className="w-12 h-12 bg-slate-50 p-1 rounded-lg sm:rounded-xl"
                        justify="center"
                        align="center"
                    >
                        <Image preview={false} width={30} className="more-services" src={icon} />
                    </Flex>

                    <Text className="text-xs sm:text-base font-medium xs:text-center sm:text-start line-clamp-1">
                        {category}
                    </Text>
                    <Flex align="center" gap={10}>
                        <Text className="text-[0.8rem] text-textGrey">
                            {size === 0 ? `No Data Available` : `${size} Files`}
                        </Text>
                    </Flex>
                </Flex>
            </Card>
        </Link>
    );
}

export default BDocsCategoryCards;
