import React from 'react';

import { Flex, Typography, Row, Col } from 'antd';
import { ReactSVG } from 'react-svg';

import Tick from '@src/assets/svg/tick.svg';

type Props = {
    title: string;
    itemsPerColumn?: number;
    items: string[] | string;
    showTicks: boolean;
};

type Section = {
    title: string;
    items: string[];
};

const ReviewLists = ({ title, items, showTicks, itemsPerColumn }: Props) => {
    if (!items) return null;

    // ----------------------------------
    // STEP 1: Normalize items
    // ----------------------------------
    const normalizedItems: string[] =
        typeof items === 'string'
            ? items
                  .split('\n')
                  .map(item => item.trim())
                  .filter(Boolean)
            : items.map(item => item.trim()).filter(Boolean);

    if (normalizedItems.length === 0) return null;

    // ----------------------------------
    // STEP 2: Build sections from ##
    // ----------------------------------
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let hasSectionHeaders = false;

    normalizedItems.forEach(item => {
        if (item.startsWith('##')) {
            hasSectionHeaders = true;

            if (currentSection) {
                sections.push(currentSection);
            }

            currentSection = {
                title: item.replace(/^##\s*/, ''),
                items: [],
            };
        } else {
            if (!currentSection) {
                currentSection = {
                    title,
                    items: [],
                };
            }
            currentSection.items.push(item);
        }
    });

    if (currentSection) {
        sections.push(currentSection);
    }

    // ----------------------------------
    // STEP 3: Render
    // ----------------------------------
    const renderItems = (itemList: string[]) =>
        itemList.map((item, idx) => (
            <Flex align="center" key={idx}>
                {showTicks && <ReactSVG className="mr-2" src={Tick} />}
                <Typography.Text className="text-sm">{item}</Typography.Text>
            </Flex>
        ));

    // No section headers — split items directly into 2 columns
    if (!hasSectionHeaders) {
        const splitAt = itemsPerColumn ?? Math.ceil(normalizedItems.length / 2);
        const leftItems = normalizedItems.slice(0, splitAt);
        const rightItems = normalizedItems.slice(splitAt);

        return (
            <Flex vertical className="w-full h-full" gap={20}>
                <Typography.Text className="text-lg font-medium">{title}</Typography.Text>
                <Flex gap={48}>
                    <Flex vertical className="gap-3">{renderItems(leftItems)}</Flex>
                    <Flex vertical className="gap-3">{renderItems(rightItems)}</Flex>
                </Flex>
            </Flex>
        );
    }

    // Has section headers — render sections row-wise in 2 columns
    const mid = Math.ceil(sections.length / 2);

    return (
        <Flex vertical className="w-full h-full" gap={20}>
            <Typography.Text className="text-lg font-medium">{title}</Typography.Text>
            <Flex vertical gap={20}>
                {Array.from({ length: mid }).map((_, rowIndex) => {
                    const leftSection = sections[rowIndex];
                    const rightSection = sections[rowIndex + mid];

                    return (
                        <Row key={rowIndex} gutter={64} align="top">
                            <Col span={12}>
                                {leftSection && (
                                    <Flex vertical className="gap-3">
                                        <Typography.Text className="text-base font-semibold">
                                            {leftSection.title}
                                        </Typography.Text>
                                        {renderItems(leftSection.items)}
                                    </Flex>
                                )}
                            </Col>
                            <Col span={12}>
                                {rightSection && (
                                    <Flex vertical className="gap-3">
                                        <Typography.Text className="text-base font-semibold">
                                            {rightSection.title}
                                        </Typography.Text>
                                        {renderItems(rightSection.items)}
                                    </Flex>
                                )}
                            </Col>
                        </Row>
                    );
                })}
            </Flex>
        </Flex>
    );
};

export default ReviewLists;
