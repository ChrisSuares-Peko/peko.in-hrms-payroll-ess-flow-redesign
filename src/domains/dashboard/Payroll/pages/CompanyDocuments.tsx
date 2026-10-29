import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import emptyDocsSVG from '../assets/icons/companydocuments/emptyDocs.svg';
import PayrollDocsCard from '../components/Dashboard/PayrollDocsCard';
import { useGetCompanyDoc, type CompanyDocCategoryCard } from '../hooks/dashboardHooks/useGetCompanyDoc';

function CompanyDocuments() {
    const { data, isLoading } = useGetCompanyDoc();

    return (
        <Content className="mb-20">
            <Typography.Text className="font-medium text-lg sm:text-xl">
                Company Documents
            </Typography.Text>
            <Row gutter={[20, 25]} justify="start" align="middle" className="my-8">
                {isLoading === true &&
                    Array.from({ length: 20 }, (_, i) => (
                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                            lg={12}
                            xl={6}
                            xxl={6}
                            key={i}
                            className="flex justify-center"
                        >
                            <Skeleton paragraph={{ rows: 3 }} />
                        </Col>
                    ))}
                {!isLoading && data.length === 0 ? (
                    <Flex className="w-full h-96" justify="center" align="center" gap={20} vertical>
                        <ReactSVG src={emptyDocsSVG} />
                        <Typography.Text className="text-center text-gray-400 ms-2 text-base">
                            No files found
                        </Typography.Text>
                    </Flex>
                ) : (
                    data.map((item: CompanyDocCategoryCard) => (
                        <Col xs={12} sm={12} md={6} lg={12} xl={6} xxl={6} key={item.id}>
                            <PayrollDocsCard
                                icon={item.icon}
                                category={item.category}
                                size={item.size}
                                loading={isLoading}
                            />
                        </Col>
                    ))
                )}
            </Row>
        </Content>
    );
}

export default CompanyDocuments;
