import { useState } from 'react';

import { Col, Row, Tabs, TabsProps, Typography } from 'antd';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { useScrollToTop } from '@src/hooks/useScrollToTop';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import SubscriptionInfoCard from '../components/Subscriptions/SubscriptionInfoCard';
import SubscriptionTable from '../components/Subscriptions/SubscriptionTable';
import { useGetAllSubscriptionInfoApi } from '../hooks/subscriptionHooks/useListSubscriptionInfoApi';
import { useGetAllSubscriptionApi } from '../hooks/subscriptionHooks/useListSubscriptionsApi';
import { subscriptionData } from '../utils/subscription';
import useFilter from '../utils/useFilter';

const Subscriptions = () => {
    useHideWidgetOnDrawer(true);
    useScrollToTop();
    const [reloadInfo, setReloadInfo] = useState(false);
    const { infoDetails } = useGetAllSubscriptionInfoApi(reloadInfo);
    subscriptionData[0].value = infoDetails.totalSubscriptions.toString();
    subscriptionData[1].value = infoDetails.activeSubscriptions.toString();
    subscriptionData[2].value = infoDetails.totalUsers.toString();
    subscriptionData[3].value = formatNumberWithLocalString(infoDetails.totalSpent);
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
    const { tableDatas, orderCount, tableLoading } = useGetAllSubscriptionApi(
        filter.page,
        filter.limit,
        reloadTable,
        filter.searchText
    );
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Subscriptions  ',
            children: (
                <SubscriptionTable
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
            <Typography.Text className="text-xl font-medium ">Subscriptions</Typography.Text>

            <Row>
                <Col md={24} className="py-7">
                    <Row gutter={[20, 20]} className="">
                        {subscriptionData.map((item, i) => (
                            <Col xs={12} xl={6} key={i} className="min-h-10 flex justify-center">
                                <SubscriptionInfoCard
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

export default Subscriptions;
