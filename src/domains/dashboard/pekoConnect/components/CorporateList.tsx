import React, { useEffect, useMemo, useState } from 'react';

import { Flex, Typography, Button, Input, Empty } from 'antd';
import { ReactSVG } from 'react-svg';
import { twMerge } from 'tailwind-merge';

import Vectors from '@domains/dashboard/pekoConnect/assets/Connection-Icon.svg';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import Chat from './Chat';
import ChatList from './ChatList';
import ConnectionRequest from './ConnectionRequest';

type CorporateListProps = {
    requests: any;
    refresh: () => void;
    isLoading: boolean;
    handleConnection: () => void;
};

const { Text } = Typography;

const CorporateList = ({ refresh, requests, isLoading, handleConnection }: CorporateListProps) => {
    const { user } = useAppSelector(state => state.reducer.user);
    const currentUserEmail = user?.email;

    const [activeKey, setActiveKey] = useState('1');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeTab, setActiveTab] = useState('1');
    const [chatId, setChatId] = React.useState<string | null>(null);
    const [recieverId, setRecieverId] = React.useState<string | null>(null);
    const [sendId, setSendId] = React.useState<string | null>(null);

    const [request, setRequest] = React.useState<string | null>(null);
    const [query, setQuery] = useState('');

    const [rName, setRname] = useState('');
    const screens = useScreenSize();
    const getMaxHeight = useMemo(() => {
        if (screens.xxl) return 'calc(100vh - 280px)';
        if (screens.md) return 'calc(100vh - 260px)';
        return 'calc(100vh - 180px)';
    }, [screens]);

    useEffect(() => {
        if (chatId) {
            setActiveKey('1');
        } else if (request) {
            setActiveKey('2');
        } else {
            setActiveKey('default'); // Default state
        }
    }, [chatId, request]);

    const renderComponent = React.useMemo(() => {
        switch (activeKey) {
            case '1':
                return (
                    <Chat
                        currentUser={{ email: currentUserEmail }}
                        roomId={chatId}
                        rName={rName}
                        recieverId={recieverId}
                        sendId={sendId}
                    />
                );

            case '2':
                return (
                    <ConnectionRequest
                        request={request}
                        setChatId={setChatId}
                        setRequest={setRequest}
                        refresh={refresh}
                        onClose={() => {
                            setActiveKey('1');
                            setChatId(null);
                            setRequest(null);
                        }}
                    />
                );
            default:
                return (
                    <div className="flex items-center justify-center w-full h-full">
                        <Empty description="Please select a chat" />
                    </div>
                );
        }
    }, [activeKey, chatId, currentUserEmail, rName, recieverId, refresh, request, sendId]);

    const renderSidebar = () => {
        if (activeTab === '2') return <p className="p-2">Call history</p>;
        return (
            <ChatList
                chatId={chatId}
                setChatId={s => setChatId(s)}
                setRequest={setRequest}
                queryString={query}
                requests={requests}
                setRname={setRname}
                setRecieverId={setRecieverId}
                setSendId={setSendId}
            />
        );
    };

    return (
        // <Flex className="min-h-screen bg-white">
        //   {/* Sidebar */}
        //   <Flex
        //     vertical
        //     className="w-1/3 border-r"
        //     style={{
        //       maxHeight: "calc(100vh - 180px)",
        //       overflowY: "auto",
        //     }}
        //   >
        //     <div className="p-4">
        //       <Input placeholder="Search for a connection" />
        //     </div>
        //     <ChatList currentUser={{ email: currentUserEmail }} onSelectUser={handleUserSelect} />
        //   </Flex>

        //   {/* Chat Window */}
        //   <Flex className="flex-grow">
        //     {selectedUser ? (
        //       <Chat currentUser={{ email: currentUserEmail }} receiverEmail={selectedUser} />
        //     ) : (
        //       <div className="flex items-center justify-center w-full h-full text-center">
        //         <Text>Select a user to start chatting</Text>
        //       </div>
        //     )}
        //   </Flex>
        // </Flex>
        <>
            <Flex
                gap={12}
                justify="space-between"
                align="center"
                className={twMerge(
                    request || chatId ? 'hidden md:flex' : 'flex',
                    'px-5 py-4 md:px-0 md:py-0'
                )}
            >
                <Text className="text-lg font-medium sm:text-xl">Connect</Text>
                <Button
                    danger
                    type="primary"
                    onClick={handleConnection}
                    className="font-medium md:w-36"
                >
                    {screens.md ? 'New Connection' : <ReactSVG src={Vectors} />}
                </Button>
            </Flex>
            <Flex className="flex-grow min-h-[calc(100vh-170px)] md:min-h-[calc(100vh-220px)] lg:min-h-[calc(100vh-210px)] xl:min-h-[calc(100vh-240px)] xxl:md:min-h-[calc(100vh-280px)] md:mt-4 bg-white md:border md:rounded-xl">
                <Flex
                    vertical
                    className={twMerge(
                        request || chatId
                            ? 'hidden md:flex w-full md:w-2/5 lg:w-1/2 xl:w-4/12 xxl:w-3/12'
                            : 'flex w-full md:w-2/5 lg:w-1/2 xl:w-4/12 xxl:w-3/12'
                    )}
                    style={{
                        overflowY: 'auto',
                        maxHeight: getMaxHeight,
                    }}
                >
                    <div className="px-2 m-2 md:mt-6">
                        <Input
                            placeholder="Search for a Connection"
                            className=""
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                    {renderSidebar()}
                </Flex>
                <Flex
                    className={twMerge(
                        !request && !chatId
                            ? 'hidden md:flex flex-grow border-l'
                            : 'flex-grow border-l'
                    )}
                >
                    {renderComponent}
                </Flex>
            </Flex>
        </>
    );
};

export default React.memo(CorporateList);
