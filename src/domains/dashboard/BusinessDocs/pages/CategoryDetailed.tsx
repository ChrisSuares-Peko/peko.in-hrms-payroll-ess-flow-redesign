import React, { useState } from 'react';

import { Col, Flex, Pagination, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import useScreenSize from '@src/hooks/useScreenSize';

import emptyDocsSVG from '../assets/icons/emptyDocs.svg';
import DocsListing from '../components/DocsListing';
import FilterComponent from '../components/FilterComponent';
import { ICategoryListingCard } from '../types/type';

const { Text } = Typography;

function CategoryDetailed() {
    const [docsData, setdocsData] = useState<ICategoryListingCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [itemCount, setItemCount] = useState<number>(12);
    const [pageSize, setPageSize] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const location = useLocation();
    const { sm } = useScreenSize();
    const { state } = location;

    const size = sm ? 'default' : 'small';
    return (
        <Content className="p-0 mb-20 mt-8">
            <Row gutter={[20, 20]}>
                <Col xs={24} sm={12} md={13} lg={14} xl={15} xxl={16}>
                    <Text className="text-lg font-medium">{state.category}</Text>
                </Col>
                <Col xs={24} sm={12} md={11} lg={10} xl={9} xxl={8}>
                    <FilterComponent
                        setIsloading={setIsLoading}
                        category={state.category}
                        docsData={setdocsData}
                        setcount={setItemCount}
                        page={currentPage}
                        pageSize={pageSize}
                    />
                </Col>
            </Row>
            <Row gutter={[5, 20]} className="my-7">
                {isLoading &&
                    Array.from({ length: 12 }, (_, i) => (
                        <Col
                            xs={24}
                            sm={12}
                            md={8}
                            lg={12}
                            xl={6}
                            xxl={6}
                            key={i}
                            className="flex justify-center w-full p-0 m-0"
                        >
                            <Skeleton paragraph={{ rows: 3 }} />
                        </Col>
                    ))}
                {!isLoading && docsData.length === 0 ? (
                    <Flex className="w-full h-96" justify="center" align="center" gap={20} vertical>
                        <ReactSVG src={emptyDocsSVG} />
                        <Text className="text-center text-gray-400 ms-2 text-base">
                            No files found
                        </Text>
                    </Flex>
                ) : (
                    docsData.map((item, i) => (
                        <DocsListing key={i} title={item.title} documentUrl={item.documentUrl} />
                    ))
                )}
            </Row>
            {itemCount > 12 ? (
                <Pagination
                    className="sm:text-end text-center mt-10"
                    defaultPageSize={12}
                    defaultCurrent={1}
                    size={size}
                    total={itemCount}
                    pageSizeOptions={['10', '12', '20', '30', '100']}
                    onChange={(pageCount, itemNumber) => {
                        setCurrentPage(pageCount);
                        setPageSize(itemNumber);
                    }}
                />
            ) : (
                ''
            )}
        </Content>
    );
}

export default CategoryDetailed;
