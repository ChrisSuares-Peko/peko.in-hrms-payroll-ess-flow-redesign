import React, { useMemo, useRef, useEffect } from 'react';

import { Col, Flex, Grid, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation } from 'react-router-dom';

import ServiceUnavailable from '@src/domains/failed/pages/ServiceUnavailable';

import Card from './Card';
import { getPathFromLabel, getServiceAccessList } from '../utils/helperFunctions';

interface CardListProps {
    category: string;
}

const CardList = ({ category }: CardListProps) => {
    const filteredItems = getServiceAccessList(category);
    const location = useLocation();

    const query = useMemo(
        () => Object.fromEntries(new URLSearchParams(location.search).entries()),
        [location.search]
    );

    const screens = Grid.useBreakpoint();

    // Create a ref mapping for each category
    const categoryRefs = useRef<any>({});

    // Scroll to the category when the component mounts or `query.category` changes
    useEffect(() => {
        const formattedCategory = query.category
            ?.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        if (formattedCategory && categoryRefs.current[formattedCategory]) {
            setTimeout(() => {
                categoryRefs.current[formattedCategory].scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }, 100); // Slight delay to ensure DOM is ready
        }
    }, [query.category]);

    if (filteredItems.length === 0) return <ServiceUnavailable />;

    return (
        <Content className="px-0">
            {filteredItems.map(
                (cat, j) =>
                    cat?.services?.length && (
                        <React.Fragment key={j}>
                            <div
                                ref={el => {
                                    categoryRefs.current[cat.category || 'General'] = el;
                                }}
                            >
                                <Flex className="mb-[2rem] text-[1.25rem] font-medium md:px-5 px-0">
                                    {cat?.category || 'General'}
                                </Flex>
                            </div>

                            <Row gutter={screens.xs ? [20, 20] : [20, 40]}>
                                {cat?.services.map((item, i) => (
                                    <Col key={i} xs={6} sm={6} md={4} lg={6} xl={4} xxl={3}>
                                        <Card
                                            icon={item?.icon as string}
                                            title={item?.service}
                                            path={getPathFromLabel(item?.service)}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </React.Fragment>
                    )
            )}
        </Content>
    );
};

export default CardList;
