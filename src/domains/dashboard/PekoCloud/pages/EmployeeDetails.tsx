import { useState } from 'react';

import { Col, Row, Typography } from 'antd';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

import EmployeeDetailsInfoCard from '../components/EmployeeDetails/EmployeeDetailsInfoCard';
import EmployeeDetailsTab from '../components/EmployeeDetails/EmployeeDetailsTab';
import { useGetAllEmployeeApi } from '../hooks/employeeHooks/useListEmployeeApi';
import { useGetEmployeeInfoApi } from '../hooks/employeeHooks/useListEmployeeInfoApi';
import { employeeDetailsData } from '../utils/employeeDetails';
import useFilter from '../utils/useFilter';

const EmployeeDetails = () => {
    useHideWidgetOnDrawer(true);
    useScrollToTop();
    const [reloadInfo, setReloadInfo] = useState(false);
    const { infoDetails } = useGetEmployeeInfoApi(reloadInfo);
    const [reloadTable, setReloadTable] = useState(false);
    employeeDetailsData[0].value = infoDetails.totalEmployees.toString();
    employeeDetailsData[1].value = infoDetails.deviceUsers.toString();
    employeeDetailsData[2].value = infoDetails.subscriptionUsers.toString();
    employeeDetailsData[3].value = infoDetails.totalSpent.toFixed(2).toString();
    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 10,
        filter: '',
        year: 0,
        month: 0,
    };
    const [filter, setFilter] = useState<any>(initialValues);
    const { handlePageChange, handleSearch } = useFilter({
        setFilter,
    });
    const { tableDatas, orderCount, tableLoading } = useGetAllEmployeeApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText
    );
    return (
        <>
            <Typography.Text className="text-xl font-medium ">Employee Details</Typography.Text>

            <Row>
                <Col md={24} className="py-10">
                    <Row gutter={[20, 20]} className="">
                        {employeeDetailsData.map((item, i) => (
                            <Col xs={12} xl={6} key={i} className="min-h-10 flex justify-center">
                                <EmployeeDetailsInfoCard
                                    title={item.title}
                                    value={item.value}
                                    icon={item.icon}
                                    key={i}
                                    bgColor={item.bgColor}
                                    isCurrency={item.isCurrency}
                                />
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>
            <EmployeeDetailsTab
                reloadInfo={setReloadInfo}
                setReloadTable={setReloadTable}
                handlePageChange={handlePageChange}
                handleSearch={handleSearch}
                tableLoading={tableLoading}
                orderCount={orderCount}
                tableDatas={tableDatas}
                page={filter.page}
                limit={filter.limit}
            />
        </>
    );
};

export default EmployeeDetails;
