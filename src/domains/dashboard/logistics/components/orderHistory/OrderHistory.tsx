import React, { useState, useEffect } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Input, Button, Flex, Typography } from 'antd';
import { debounce } from 'lodash';

import useScreenSize from '@src/hooks/useScreenSize';

import HistoryTable from './HistoryTable';

const OrderHistory: React.FC = () => {
    const [searchTextInput, setSearchTextInput] = useState('');
    const [searchText, setSearchText] = useState<string>('');
    const { xs } = useScreenSize();

    useEffect(() => {
        const debouncedSetSearchText = debounce((value: string) => {
            setSearchText(value);
        }, 500);

        if (xs) {
            debouncedSetSearchText(searchTextInput);
        }

        return () => debouncedSetSearchText.cancel();
    }, [searchTextInput, xs]);

    return (
        <Flex vertical>
            {xs ? (
                <>
                    <Flex align="center">
                        <Input
                            placeholder="Search"
                            style={{
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            }}
                            value={searchTextInput}
                            onChange={e => setSearchTextInput(e.target.value)}
                            suffix={<SearchOutlined />}
                        />
                    </Flex>
                    <Typography.Paragraph className="w-full py-5 text-lg font-medium">
                        Order History
                    </Typography.Paragraph>
                </>
            ) : (
                <Flex justify="space-between" className="mb-4">
                    <Typography.Paragraph className="text-xl font-medium">
                        Order History
                    </Typography.Paragraph>
                    <Flex align="center">
                        <Input
                            placeholder="Search"
                            style={{
                                width: 'calc(100% - 10px)',
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            }}
                            value={searchTextInput}
                            onChange={e => setSearchTextInput(e.target.value)}
                        />
                        <Button
                            icon={<SearchOutlined />}
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                            onClick={() => setSearchText(searchTextInput)}
                        />
                    </Flex>
                </Flex>
            )}
            <HistoryTable searchText={searchText} />
        </Flex>
    );
};

export default OrderHistory;
