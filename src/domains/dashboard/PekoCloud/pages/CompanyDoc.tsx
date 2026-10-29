import { useEffect, useState } from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import activeDoc from '@domains/dashboard/PekoCloud/assets/icons/activeDoc.svg';
import complianceDoc from '@domains/dashboard/PekoCloud/assets/icons/complianceDoc.svg';
import expiredDoc from '@domains/dashboard/PekoCloud/assets/icons/expiredDoc.svg';
import totalDoc from '@domains/dashboard/PekoCloud/assets/icons/totalDoc.svg';
import useScreenSize from '@src/hooks/useScreenSize';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

import CompanyDocMobileView from '../components/CompanyDoc/CompanyDocMobileView';
import DocInfoCard from '../components/CompanyDoc/DocInfoCard';
import DocTable from '../components/CompanyDoc/DocTable';
import { useGetInfoCardAllDocApi } from '../hooks/companyDocHooks/useInfoCardListApi';
import { useGetAllCompanyDocApi } from '../hooks/companyDocHooks/useListCompanyDocApi';
import useFilter from '../utils/useFilter';

const CompanyDoc = () => {
    useHideWidgetOnDrawer(true);
    useScrollToTop();
    const screen = useScreenSize();
    const [reloadTable, setReloadTable] = useState(false);
    const [companyDocData, setCompanyDocData] = useState([
        {
            title: 'Total Documents',
            value: '0',
            isPercentage: false,
            icon: totalDoc,
            bgColor: 'bg-[#FFF6F2]',
        },
        {
            title: 'Active Documents',
            value: '0',
            isPercentage: false,
            icon: activeDoc,
            bgColor: 'bg-[#F9F4FF]',
        },
        {
            title: 'Documents Expired',
            value: '0',
            isPercentage: false,
            icon: expiredDoc,
            bgColor: 'bg-[#FFFBE4]',
        },
        {
            title: 'Completion Level',
            value: '0',
            isPercentage: true,
            icon: complianceDoc,
            bgColor: 'bg-[#F6FCEB]',
        },
    ]);

    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 5,
        filter: '',
        year: 0,
        month: 0,
    };
    const [filter, setFilter] = useState<any>(initialValues);
    const { handlePageChange, handleSearch } = useFilter({
        setFilter,
    });
    const { tableDatas, orderCount, tableLoading } = useGetAllCompanyDocApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText
    );
    const { infoDetails } = useGetInfoCardAllDocApi(reloadTable);
    useEffect(() => {
        const updatedCompanyDocData = companyDocData.map(doc => {
            switch (doc.title) {
                case 'Total Documents':
                    return { ...doc, value: infoDetails.totalDocuments.toString() };
                case 'Active Documents':
                    return { ...doc, value: infoDetails.activeDocuments.toString() };
                case 'Documents Expired':
                    return { ...doc, value: infoDetails.expiredDocuments.toString() };
                case 'Completion Level':
                    return { ...doc, value: infoDetails.completionLevel.toFixed(2) };
                default:
                    return doc;
            }
        });

        setCompanyDocData(updatedCompanyDocData); // Update companyDocData state
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [infoDetails]);

    return (
        <Flex vertical className="min-h-[100vh]">
            <Typography.Text className="text-xl font-medium ">Documents</Typography.Text>

            <Row>
                <Col md={24} className="py-10">
                    <Row gutter={[20, 20]} className="">
                        {companyDocData.map((item, i) => (
                            <Col xs={12} xl={6} key={i} className="flex justify-center min-h-10">
                                <DocInfoCard
                                    title={item.title}
                                    value={item.value}
                                    icon={item.icon}
                                    isPercentage={item.isPercentage}
                                    key={i}
                                    bgColor={item.bgColor}
                                />
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>
            {screen.xs ? (
                <CompanyDocMobileView
                    setReloadTable={setReloadTable}
                    handlePageChange={handlePageChange}
                    handleSearch={handleSearch}
                    tableLoading={tableLoading}
                    orderCount={orderCount}
                    tableDatas={tableDatas}
                    page={filter.page}
                    limit={filter.limit}
                />
            ) : (
                <DocTable
                    setReloadTable={setReloadTable}
                    handlePageChange={handlePageChange}
                    handleSearch={handleSearch}
                    tableLoading={tableLoading}
                    orderCount={orderCount}
                    tableDatas={tableDatas.map(item => ({ ...item, key: item?.id }))}
                    page={filter.page}
                    limit={filter.limit}
                />
            )}
        </Flex>
    );
};

export default CompanyDoc;
