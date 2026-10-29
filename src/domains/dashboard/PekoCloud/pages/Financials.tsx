import { useState } from 'react';

import { Col, Flex, Row, Tabs, TabsProps, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

import ChequeBooksTable from '../components/Financials/ChequeBooksTable';
import ChequeManagementTable from '../components/Financials/ChequeManagementTable';
import FinancialInfoCard from '../components/Financials/FinancialInfoCard';
import FinancialTable from '../components/Financials/FinancialTable';
import { useGetFinancialInfoApi } from '../hooks/financialDocHooks/useListFinancialInfoCardApi';
import { financialData } from '../utils/financial';

const Financials = () => {
    useHideWidgetOnDrawer(true);
    useScrollToTop();
    const location = useLocation();
    const tab = location?.state?.tab || '1';
    const [reloadTable, setReloadTable] = useState(false);
    const { infoDetails } = useGetFinancialInfoApi(reloadTable);

    financialData[0].value = infoDetails.totalFiles.toString();
    financialData[1].value = infoDetails.totalCheques.toString();
    financialData[2].value = infoDetails.pending.toString();
    financialData[3].value = infoDetails.completed.toString();
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Cheque Management',
            children: <ChequeManagementTable reloadInfo={setReloadTable} />,
        },
        {
            key: '2',
            label: 'Cheque Books',
            children: <ChequeBooksTable reloadInfo={setReloadTable} />,
        },
        {
            key: '3',
            label: 'Financial Files',
            children: <FinancialTable reloadInfo={setReloadTable} />,
        },
    ];

    return (
        <>
            <Typography.Text className="text-xl font-medium ">Financials</Typography.Text>

            <Row>
                <Col md={24} className="py-10">
                    <Row gutter={[20, 20]} className="">
                        {financialData.map((item, i) => (
                            <Col xs={12} xl={6} key={i} className="min-h-10 flex justify-center">
                                <FinancialInfoCard
                                    title={item.title}
                                    value={item.value}
                                    icon={item.icon}
                                    isCurrency={item.isCurrency}
                                    bgColor={item.bgColor}
                                />
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>

            <Flex vertical className="">
                <Col xs={24} className="">
                    <Tabs defaultActiveKey={tab} items={items} />
                </Col>
            </Flex>
        </>
    );
};

export default Financials;
