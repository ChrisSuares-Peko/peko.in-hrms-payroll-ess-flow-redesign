/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';

import { Col, Flex, Row, Spin, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppSelector } from '@src/hooks/store';

import { getBusinessDocs } from '../api/dashBoardIndex';
import emptyDocsSVG from '../assets/icons/companydocuments/emptyDocs.svg';
import DocListing from '../components/Dashboard/DocListing';

type PayrollTemplateDocument = {
    id: number;
    name: string;
    document: string;
};

type PayrollTemplateCategory = {
    id: number;
    categoryName: string;
    documents?: PayrollTemplateDocument[];
};

type PayrollTemplatesResponse = {
    categoryDataWithDocuments?: PayrollTemplateCategory[];
};

function DocumentsCategory() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [docsData, setDocsData] = useState<PayrollTemplateDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    const state = location.state as { category?: string } | null;

    useEffect(() => {
        const getCategoryTemplates = async () => {
            if (!state?.category) {
                setDocsData([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const res: PayrollTemplatesResponse | false = await getBusinessDocs({
                userId: id,
                userType: role,
            });

            if (!res) {
                setDocsData([]);
                setIsLoading(false);
                return;
            }

            const selectedCategory = res.categoryDataWithDocuments?.find(
                item => item.categoryName === state.category
            );

            setDocsData(selectedCategory?.documents ?? []);
            setIsLoading(false);
        };

        getCategoryTemplates();
    }, [id, role, state?.category]);

    return (
        <Content className="p-0 mb-20 mt-8">
            <Row gutter={[20, 20]}>
                <Col xs={24} sm={12} md={13} lg={14} xl={15} xxl={16}>
                    <Typography.Text className="text-lg font-medium">
                        {state?.category ?? 'Company Documents'}
                    </Typography.Text>
                </Col>
                <Col xs={24} sm={12} md={11} lg={10} xl={9} xxl={8} />
            </Row>
            <Row gutter={[5, 20]} className="my-7">
                {isLoading ? (
                    <Col span={24} className="flex justify-center mt-20">
                        <Spin />
                    </Col>
                ) : docsData.length === 0 ? (
                    <Flex className="w-full h-96" justify="center" align="center" gap={20} vertical>
                        <ReactSVG src={emptyDocsSVG} />
                        <Typography.Text className="text-center text-gray-400 ms-2 text-base">
                            No files found
                        </Typography.Text>
                    </Flex>
                ) : (
                    docsData.map(item => (
                        <DocListing key={item.id} title={item.name} documentUrl={item.document} />
                    ))
                )}
            </Row>
        </Content>
    );
}

export default DocumentsCategory;
