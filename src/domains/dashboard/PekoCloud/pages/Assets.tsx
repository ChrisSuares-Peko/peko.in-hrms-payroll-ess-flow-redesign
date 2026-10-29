import { useState } from 'react';

import { Col, Row, Tabs, TabsProps, Typography } from 'antd';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { useScrollToTop } from '@src/hooks/useScrollToTop';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import AssetInfoCard from '../components/Assets/AssetInfoCard';
import AssetsTable from '../components/Assets/AssetsTable';
import { useGetAllAssetApi } from '../hooks/assetHooks/useListAssetApi';
import { useGetAllAssetInfoApi } from '../hooks/assetHooks/useListAssetInfoApi';
import { assetsData } from '../utils/assets';
import useFilter from '../utils/useFilter';

const Assets = () => {
    useHideWidgetOnDrawer(true);
    useScrollToTop();

    const [reloadInfo, setReloadInfo] = useState(false);
    const { infoDetails } = useGetAllAssetInfoApi(reloadInfo);
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
    const { tableDatas, orderCount, tableLoading } = useGetAllAssetApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText
    );
    assetsData[0].value = infoDetails.totalAssets.toString();
    assetsData[1].value = infoDetails.totalAssigned.toString();
    assetsData[2].value = infoDetails.availableAssets.toString();
    assetsData[3].value = formatNumberWithLocalString(infoDetails.totalAssetSpent);
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Assets',
            children: (
                <AssetsTable
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
            <Typography.Text className="text-xl font-medium ">Assets</Typography.Text>

            <Row>
                <Col md={24} className="py-7">
                    <Row gutter={[20, 20]} className="">
                        {assetsData.map((item, i) => (
                            <Col xs={12} xl={6} key={i} className="min-h-10 flex justify-center">
                                <AssetInfoCard
                                    title={item.title}
                                    value={item.value}
                                    icon={item.icon}
                                    isCurrency={item.isCurrency}
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

export default Assets;
