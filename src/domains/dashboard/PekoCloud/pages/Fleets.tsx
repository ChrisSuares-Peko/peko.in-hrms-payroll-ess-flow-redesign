import React, { useEffect, useState } from 'react';

import { Flex, Tabs, TabsProps } from 'antd';
import { useLocation } from 'react-router-dom';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';

import DocumentsTab from '../components/FleetManagement/DocumentsTab';
import FleetDetailsHeader from '../components/FleetManagement/FleetDetailsHeader';
import InformationsTab from '../components/FleetManagement/InformationsTab';
import MaintenanceTab from '../components/FleetManagement/MaintenanceTab';
import UsageHistoryTab from '../components/FleetManagement/UsageHistoryTab';
import GetLatestVehicleUsage from '../hooks/fleetHooks/useGetLatestUsageApi';
import GetSingleVehicleDetails from '../hooks/fleetHooks/useGetSingleVehicleApi';

type Props = {};

const Fleets = (props: Props) => {
    useHideWidgetOnDrawer(true);
    const location = useLocation();
    const { fleetId } = location.state;
    const [refState, setRefState] = useState(0);

    const { vehicleDetails, getVehicleDetails, isLoading } = GetSingleVehicleDetails(fleetId ?? '');
    const { getUsageDetails, loader, usageDetails } = GetLatestVehicleUsage(fleetId ?? '');
    useEffect(() => {
        getVehicleDetails();
        getUsageDetails();
    }, [getUsageDetails, getVehicleDetails, refState]);
    const items: TabsProps['items'] = [
        // {
        //     key: '0',
        //     label: '',
        // },
        {
            key: '1',
            label: 'Information',
            children: (
                <InformationsTab
                    setRefState={setRefState}
                    vehicleData={vehicleDetails}
                    data={usageDetails}
                    isLoading={isLoading || loader}
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
        {
            key: '4',
            label: 'Maintenance',
            children: <MaintenanceTab />,
        },
    ];
    return (
        <Flex vertical>
            <FleetDetailsHeader setRefState={setRefState} vehicleDetails={vehicleDetails} />
            <Tabs
                defaultActiveKey="1"
                //    className="w-full mt-2 -ml-10"
                className="w-full mt-2 "
                items={items}
                //   style={{ width: screens.xxl ? '105.5%' : '106.5%' }}
            />
        </Flex>
    );
};

export default Fleets;
