import { useEffect, useState } from 'react';

import { Flex, Grid, Tabs, TabsProps } from 'antd';
import { useLocation } from 'react-router-dom';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';

import ChequeDetailsHeader from '../components/Financials/CHequeDetailsHeader';
import ChequeInformations from '../components/Financials/ChequeInformations';
import GetSingleChequeLeafDetails from '../hooks/financialDocHooks/useGetSingleChequeLeafApi';

type Props = {};

const ChequeDetails = (props: Props) => {
    useHideWidgetOnDrawer(true);
    const screens = Grid.useBreakpoint();
    const location = useLocation();
    const { chequeLeafId } = location.state;

    const [refState, setRefState] = useState(0);
    const { chequeLeafDetails, getChequeLeafDetails, isLoading } = GetSingleChequeLeafDetails(
        chequeLeafId ?? ''
    );

    useEffect(() => {
        getChequeLeafDetails();
    }, [getChequeLeafDetails, refState]);

    const items: TabsProps['items'] = [
        {
            key: '0',
            label: '',
        },
        {
            key: '1',
            label: 'Information',
            children: (
                <ChequeInformations
                    chequeLeafDetails={chequeLeafDetails}
                    setRefState={setRefState}
                    isLoading={isLoading}
                />
            ),
        },
    ];
    return (
        <Flex vertical>
            <ChequeDetailsHeader data={chequeLeafDetails} setRefState={setRefState} />
            <Tabs
                defaultActiveKey="1"
                className="w-full mt-2 -ml-10"
                items={items}
                style={{ width: screens.xxl ? '105.5%' : '106.5%' }}
            />
        </Flex>
    );
};

export default ChequeDetails;
