import { useEffect, useState } from 'react';

import { Flex, Tabs, TabsProps } from 'antd';
import { useLocation } from 'react-router-dom';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';

import ChequeBookDetailsHeader from '../components/Financials/ChequeBookDetailsHeader';
import ChequeBookInformation from '../components/Financials/ChequeBookInformations';
import ChequeLeafTable from '../components/Financials/ChequeLeafTable';
import GetSingleChequeBookDetails from '../hooks/financialDocHooks/useGetSingleChequeBookApi';

type Props = {};

const ChequeBookDetails = (props: Props) => {
    useHideWidgetOnDrawer(true);
    const location = useLocation();
    const { chequeBookId } = location.state;

    const [refState, setRefState] = useState(0);
    const { chequeBookDetails, getChequeBookDetails, isLoading } = GetSingleChequeBookDetails(
        chequeBookId ?? ''
    );

    useEffect(() => {
        getChequeBookDetails();
    }, [getChequeBookDetails, refState]);

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Information',

            children: (
                <ChequeBookInformation
                    setRefState={setRefState}
                    chequeBookData={chequeBookDetails}
                    isLoading={isLoading}
                />
            ),
        },
        {
            key: '2',
            label: 'Cheques Leaf List',

            children: <ChequeLeafTable chequeBookId={chequeBookId} />,
        },
    ];
    return (
        <Flex vertical>
            <ChequeBookDetailsHeader data={chequeBookDetails} />
            <Tabs defaultActiveKey="1" className="w-full mt-2" items={items} />
        </Flex>
    );
};

export default ChequeBookDetails;
