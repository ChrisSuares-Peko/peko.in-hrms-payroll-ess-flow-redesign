import React, { lazy } from 'react';

import { Col, Empty, Flex, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { Project } from '../../types/dashboard';

const DashboardProjectListing = lazy(() => import('../projectListing/DashboardProjectListing'));

const { Text } = Typography;

type Props = {
    projectData: Project[] | undefined;
};

const TopProjectSection = ({ projectData }: Props) => (
    <Col span={24}>
        <Flex justify="space-between" align="end">
            <Flex>
                <Text className="text-black text-lg font-normal">Top Projects</Text>
            </Flex>
            <Link to={paths.zeroCarbon.projectListing}>
                <Text className="text-red-500 text-md font-normal text-end">View All</Text>
            </Link>
        </Flex>
        <Row
            gutter={[20, 35]}
            className="mt-5 w-full"
            justify={projectData && projectData.length > 0 ? 'start' : 'center'}
        >
            {projectData && projectData.length > 0 ? (
                projectData.map((item, i) => (
                    <Col xs={24} md={6} lg={12} xl={6} key={i} className="mt-2 ">
                        <DashboardProjectListing
                            key={i}
                            image={item.logo}
                            id={i}
                            title={item.name}
                            location={`${item.city}, ${item.country}`}
                            path={`${paths.zeroCarbon.projectDetails}/${item.id}`}
                        />
                    </Col>
                ))
            ) : (
                <Flex vertical justify="center" align="center" className="h-full">
                    <Empty description="No Projects Found" />
                </Flex>
            )}
        </Row>
    </Col>
);

export default React.memo(TopProjectSection);
