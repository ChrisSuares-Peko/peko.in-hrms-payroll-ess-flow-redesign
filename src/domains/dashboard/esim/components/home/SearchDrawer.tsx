import React, { useCallback, useEffect, useState } from 'react';

import { Drawer, Flex, Typography, Input, Skeleton } from 'antd';
import { ReactSVG } from 'react-svg';

import SmartPhoneSVG from '../../assets/icons/smartphone.svg';
import useGetCompatibleDevice from '../../hooks/useListCompatibleDevice';
import { Device } from '../../types/compatibleDeviceType';
import '../../assets/style.css';

type Props = {
    toggleModal: () => void;
    isModalOpen: boolean;
};

const SearchDrawer = ({ isModalOpen, toggleModal }: Props) => {
    const [filteredData, setFilteredData] = useState<Device[]>();
    const { compatibleDeviceList: data, isLoading } = useGetCompatibleDevice();

    const handleFilter = useCallback(
        (key: string) => {
            setFilteredData(data);
            if (key === '') return;

            const res = data?.filter(
                item =>
                    // item.model.toLowerCase().includes(key.toLowerCase()) ||
                    item.name.toLowerCase().includes(key.toLowerCase()) ||
                    item.brand.toLowerCase().includes(key.toLowerCase())
            );

            setFilteredData(res || []);
        },
        [data]
    );

    useEffect(() => {
        if (data) handleFilter('');
    }, [data, handleFilter]);

    return (
        <Drawer
            title="Search for Device"
            onClose={toggleModal}
            open={isModalOpen}
            width={450}
            className="p-0 m-0"
        >
            {isLoading || !filteredData ? (
                <Skeleton paragraph={{ rows: 10 }} />
            ) : (
                <>
                    <Flex className="mb-4" gap={10} vertical>
                        <Typography.Text className="font-medium">
                            Enter Your Device Model
                        </Typography.Text>
                        <Input
                            placeholder="Enter Your Device Model"
                            onChange={e => handleFilter(e.target.value)}
                        />
                    </Flex>
                    <Flex className="my-4 mt-6">
                        {filteredData && filteredData.length === 0 ? (
                            <Typography.Text className="font-medium capitalize">
                                No Result Found
                            </Typography.Text>
                        ) : (
                            <Typography.Text className="font-medium ">Models</Typography.Text>
                        )}
                    </Flex>
                    <Flex vertical className="custom-scrollbar h-[75vh]">
                        {filteredData &&
                            filteredData.map(item => (
                                <Flex
                                    gap={15}
                                    className="border-t py-4 p-3"
                                    justify="start"
                                    align="flex-end"
                                >
                                    <ReactSVG
                                        src={SmartPhoneSVG}
                                        beforeInjection={svg => {
                                            svg.setAttribute(
                                                'style',
                                                'width: 35px; height: 40px; margin-bottom:.20rem;'
                                            );
                                        }}
                                    />
                                    <Flex gap={2} vertical>
                                        <Typography.Text className="font-medium capitalize">
                                            {item.brand}
                                        </Typography.Text>
                                        <Typography.Text className="font-medium w-44 line-clamp-1 capitalize">
                                            {item.name.slice(0, 40).toLowerCase()}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex>
                                        <Typography.Text className="">OS :</Typography.Text>
                                        <Typography.Text className="font-medium ms-1 line-clamp-1">
                                            {item.os === 'ios' && 'iOS'}
                                            {item.os === 'android' && 'Android'}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            ))}
                    </Flex>
                </>
            )}
        </Drawer>
    );
};

export default SearchDrawer;
