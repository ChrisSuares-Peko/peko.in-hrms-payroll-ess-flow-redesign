import { useEffect, useState } from 'react';

import { Flex, Tabs, TabsProps } from 'antd';
import { useLocation } from 'react-router-dom';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';

import AssetDetailsHeader from '../components/AssetDetails/AssetDetailsHeader';
import BasicInformationTab from '../components/AssetDetails/BasicInformationTab';
import DocumentsTab from '../components/AssetDetails/DocumentsTab';
import UsageHistoryTab from '../components/AssetDetails/UsageHistoryTab';
import GetLatestAssetUsage from '../hooks/assetHooks/useGetLatestUsageApi';
import GetSingleAssetDetails from '../hooks/assetHooks/useGetSingleAssetApi';

type Props = {};

const AssetsDetails = (props: Props) => {
    useHideWidgetOnDrawer(true);
    const location = useLocation();
    const { assetId } = location.state;

    const [refState, setRefState] = useState(0);
    const { assetDetails, getAssetDetails, isLoading } = GetSingleAssetDetails(assetId ?? '');
    const { getUsageDetails, loader, usageDetails } = GetLatestAssetUsage(assetId ?? '');

    useEffect(() => {
        getAssetDetails();
        getUsageDetails();
    }, [getAssetDetails, getUsageDetails, refState]);

    const items: TabsProps['items'] = [
        // {
        //     key: '0',
        //     label: '',
        // },
        {
            key: '1',
            label: 'Information',

            children: (
                <BasicInformationTab
                    assetData={assetDetails}
                    setRefState={setRefState}
                    isLoading={isLoading || loader}
                    data={usageDetails}
                />
            ),
        },
        {
            key: '2',
            label: 'Documents',
            children: <DocumentsTab />,
        },
        {
            key: '3',
            label: 'Usage History',
            children: <UsageHistoryTab />,
        },
    ];
    return (
        <Flex vertical>
            <AssetDetailsHeader data={assetDetails} setRefState={setRefState} />
            <Tabs
                defaultActiveKey="1"
                className="w-full mt-2 "
                items={items}
                //  style={{ width: screens.xxl ? '105.5%' : '106.5%' }}
            />
        </Flex>
    );
};

export default AssetsDetails;
