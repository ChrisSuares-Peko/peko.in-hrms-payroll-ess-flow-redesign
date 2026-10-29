import { useCallback, useEffect, useState } from 'react';

import { Flex, Tabs, Typography } from 'antd';
import type { TabsProps } from 'antd';
import { useLocation } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { checkSubServiceAccessCorporate } from '@utils/checkAccess';

import { ContactUs, Tickets, Chats } from '../components';
import { ticketListingTableData } from '../types/type';

const NeedHelp = () => {
    const { xs } = useScreenSize();

    const { state } = useLocation();
    const [disabledTab3, setDisabledTab3] = useState(true);
    const [activeTabKey, setActiveTabKey] = useState<string>('1');
    const [chatId, setChatId] = useState<number>(0);
    const [shouldRefreshTickets, setShouldRefreshTickets] = useState(false);
    const [mobileChat, setMobileChat] = useState(false);
    const isComingFromDashboard = state ? state.item : null;

    const { Text } = Typography;

    useEffect(() => {
        if (isComingFromDashboard) {
            setActiveTabKey('1');
        }
    }, [isComingFromDashboard]);

    const handleTabChange = useCallback((key: string) => {
        setActiveTabKey(key);
        if (key === '1' || key === '2') {
            setDisabledTab3(true);
        }
    }, []);

    const handleButtonClick = useCallback(
        (record: ticketListingTableData) => {
            setChatId(record.ticketId);
            if (!xs) {
                setDisabledTab3(false);
                setActiveTabKey('3');
            } else {
                setMobileChat(true);
            }
        },
        [xs]
    );

    const handleTabChangeAfterDelete = useCallback(() => {
        handleTabChange('2');
        setShouldRefreshTickets(true);
        setMobileChat(false);
    }, [handleTabChange, setShouldRefreshTickets]);

    useEffect(() => {}, [activeTabKey]);

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Contact Us',
            children: <ContactUs />,
        },
        {
            key: '2',
            label: 'Tickets',
            children: (
                <Tickets
                    handleButtonClick={handleButtonClick}
                    shouldRefreshTickets={shouldRefreshTickets}
                    setShouldRefreshTickets={setShouldRefreshTickets}
                />
            ),
        },
        ...(!disabledTab3 && !xs
            ? [
                  {
                      key: '3',
                      label: 'Ticket Details',
                      children: <Chats chatId={chatId} onTabChange={handleTabChangeAfterDelete} />,
                  },
              ]
            : []),
    ];

    const filteredItems = items.filter(item => {
        const serviceName = item.label;
        return checkSubServiceAccessCorporate('Need Help', serviceName as string);
    });

    return xs && mobileChat ? (
        <Chats chatId={chatId} onTabChange={handleTabChangeAfterDelete} />
    ) : (
        <Flex vertical gap={20}>
            <Text className="text-lg font-medium sm:text-xl">Help</Text>
            <Tabs
                activeKey={activeTabKey}
                defaultActiveKey="1"
                items={filteredItems}
                onChange={handleTabChange}
            />
        </Flex>
    );
};

export default NeedHelp;
