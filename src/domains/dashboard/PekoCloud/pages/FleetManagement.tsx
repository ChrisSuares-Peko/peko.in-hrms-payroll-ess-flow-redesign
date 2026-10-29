import { useState } from 'react';

import { Col, Row, Tabs, TabsProps, Typography } from 'antd';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

import FleetInfoCard from '../components/fleet/FleetInfoCard';
import FleetManagementTable from '../components/fleet/FleetTable';
import { useGetAllVehicleInfoApi } from '../hooks/fleetHooks/useListFleetInfoApi';
import { useGetAllVehicleApi } from '../hooks/fleetHooks/useListVehicleApi';
import { fleetManagementData } from '../utils/fleet/fleetManagementData';
import useFilter from '../utils/useFilter';

const FleetManagement = () => {
    useHideWidgetOnDrawer(true);
    useScrollToTop();
    const [reloadInfo, setReloadInfo] = useState(false);
    const { infoDetails } = useGetAllVehicleInfoApi(reloadInfo);
    const [reloadTable, setReloadTable] = useState(false);

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

    const { tableDatas, orderCount, tableLoading } = useGetAllVehicleApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText
    );

    fleetManagementData[0].value = infoDetails.totalAssets.toString();
    fleetManagementData[1].value = infoDetails.totalAssigned.toString();
    fleetManagementData[2].value = infoDetails.availableAssets.toString();
    fleetManagementData[3].value = infoDetails.totalUnderMaintenance.toString();
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Fleet',
            children: (
                <FleetManagementTable
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
            ),
        },
        {
            key: '2',
            label: 'Usage History',
            disabled: true,
        },
    ];
    return (
        <>
            <Typography.Text className="text-xl font-medium ">Fleet Management</Typography.Text>

            <Row>
                <Col md={24} className="py-7">
                    <Row gutter={[20, 20]} className="">
                        {fleetManagementData.map((item, i) => (
                            <Col xs={12} xl={6} key={i} className="min-h-10 flex justify-center">
                                <FleetInfoCard
                                    title={item.title}
                                    value={item.value}
                                    icon={item.icon}
                                    key={i}
                                    bgColor={item.bgColor}
                                />
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>

            <Row>
                <Col xs={24} className="mt-5">
                    <Tabs defaultActiveKey="1" items={items} />
                </Col>
            </Row>
        </>
    );
};

export default FleetManagement;
