import { useCallback, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Flex, Input, Pagination, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Lottie from 'react-lottie';

import animation from '@assets/animation/zero_carbon_no_data.json';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import ProjectListCard from '../components/projectListing/ProjectListCard';
import useFilter from '../hooks/useFilter';
import useGetAllProjects from '../hooks/useGetAllProjects';
import { InitialValues, filtersState } from '../types/dashboard';

const { Text } = Typography;

const ProjectListing = () => {
    const defaultOptions = useMemo(
        () => ({
            loop: true,
            autoplay: true,
            animationData: animation,
            rendererSettings: {
                preserveAspectRatio: 'xMidYMid slice',
            },
        }),
        []
    );

    const today = new Date();
    const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const initaialValues: InitialValues = {
        searchQuery: '',
        category: '',
        sort: 'ASC',
        page: 1,
        itemsPerPage: 10,
        filter: '',
        from: firstDayOfLastMonth.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        to: firstDayOfThisMonth.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
    };
    const [filters, setFilters] = useState<filtersState>(initaialValues);
    const { data, count, isLoading } = useGetAllProjects(
        filters.searchQuery,
        filters.page,
        filters.itemsPerPage
    );
    const { md } = useScreenSize();

    const height = md ? '10rem' : '5rem';
    const { handlePageChange, handleSearch } = useFilter({ setFilters });

    const renderLoadingSkeletons = useCallback(
        () =>
            Array.from({ length: 8 }).map((_, index) => (
                <Col xs={12} sm={12} md={8} xl={6} key={index} className="px-10">
                    <Skeleton.Button
                        key={index}
                        shape="square"
                        className="w-fit"
                        style={{ height, borderRadius: '0.8rem' }}
                        active
                        block
                        size="large"
                    />
                    <Skeleton title={false} active className="mt-2" />
                </Col>
            )),
        [height]
    );

    const renderProjectList = useCallback(
        () =>
            data &&
            data.map((item, i) => (
                <Col xs={12} sm={12} md={8} xl={6} xxl={6} key={i}>
                    <ProjectListCard
                        key={i}
                        image={item.logo}
                        id={i}
                        title={item.name}
                        location={`${item.city}, ${item.country}`}
                        path={`${paths.dashboard.moreServices}/${paths.zeroCarbon.index}/${paths.zeroCarbon.projectDetails}/${item.id}`}
                    />
                </Col>
            )),
        [data]
    );

    const renderEmptyState = () => (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={15}
            className="text-center h-fit mt-20 "
        >
            <Lottie options={defaultOptions} height={250} width={250} />
            <Text className="text-textGrey -mt-10 z-10">No Projects Found</Text>
        </Flex>
    );

    return (
        <Content>
            <Row justify="space-between" align="middle">
                <Col xs={12} md={6}>
                    <Text className="   text-black text-2xl font-normal">Projects</Text>
                </Col>
                <Col xs={12} md={8}>
                    <Input
                        value={filters.searchQuery}
                        placeholder="Search For Projects"
                        suffix={<SearchOutlined />}
                        onChange={handleSearch}
                        allowClear
                        type="text"
                        maxLength={100}
                        variant="outlined"
                    />
                </Col>
            </Row>

            <Row
                gutter={[20, 35]}
                className="mt-8"
                justify={data && data.length > 0 ? 'start' : 'center'}
            >
                {isLoading ? (
                    renderLoadingSkeletons()
                ) : (
                    <>{data && data.length > 0 ? renderProjectList() : renderEmptyState()}</>
                )}
            </Row>
            {data && data.length > 0 && (
                <Pagination
                    onChange={handlePageChange}
                    pageSize={filters.itemsPerPage}
                    current={filters.page}
                    size="default"
                    className="text-end pt-7"
                    total={count}
                    showLessItems
                    showSizeChanger={false}
                />
            )}
        </Content>
    );
};
export default ProjectListing;
