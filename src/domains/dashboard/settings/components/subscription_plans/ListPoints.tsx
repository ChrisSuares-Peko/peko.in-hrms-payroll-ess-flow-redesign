import React, { useMemo } from 'react';

import { Flex, Typography, Row } from 'antd';
import { ReactSVG } from 'react-svg';

import Tick from '@src/assets/svg/tick.svg';

type Props = {
    title: string;
    itemsPerColumn: number;
    items: string[];
    showTicks: boolean;
};

const { Title } = Typography;

const ListPoints = ({ title, itemsPerColumn, items, showTicks }: Props) => {
    const renderItems = (start: number, end: number) =>
        items.slice(start, end).map((item, index) => {
            if (!item.length) return false;
            return (
                <Flex align="center" key={index}>
                    {showTicks && <ReactSVG className="mr-3" src={Tick} />}
                    <Typography.Text className="text-sm font-normal">{item}</Typography.Text>
                </Flex>
            );
        });

    const numColumns = useMemo(
        () => Math.ceil(items.length / itemsPerColumn),
        [items.length, itemsPerColumn]
    );

    return (
        items.length > 0 && (
            <Flex
                className="w-full h-full border border-gray-200 border-solid rounded-2xl"
                justify="space-between"
                align="flex-start"
                vertical
            >
                <Flex className="p-10 pb-0">
                    <Title level={5}>{title}</Title>
                </Flex>
                <Row className="mb-10">
                    {[...Array(numColumns)].map((_, columnIndex) => (
                        <Flex key={columnIndex} vertical className="gap-5 mx-10 mt-5">
                            {renderItems(
                                columnIndex * itemsPerColumn,
                                (columnIndex + 1) * itemsPerColumn
                            )}
                        </Flex>
                    ))}
                </Row>
            </Flex>
        )
    );
};

export default React.memo(ListPoints);
