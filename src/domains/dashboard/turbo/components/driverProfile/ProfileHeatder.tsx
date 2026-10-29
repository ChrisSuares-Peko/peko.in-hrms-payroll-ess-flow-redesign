import React from 'react';

import { LoadingOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { DownloadType } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { resetInputParams, resetResponse } from '../../slices/turboSlice';

const { Text } = Typography;

const ProfileHeatder = ({ searchText, handleSearch, downloadReport, isLoading }: any) => {
    const navigate = useNavigate();
    const { sm } = useScreenSize();
    const dispatch = useDispatch();
    const handleBulkUpload = () => {
        dispatch(
            showToast({
                description: `Coming Soon`,
                variant: 'info',
            })
        );
    };
    return (
        <>
            <Flex className="flex-col md:flex-row justify-between mt-3 md:mt-0 w-full">
                {/* Title + Subtitle block */}
                <Flex vertical className="w-full">
                    <Text className="flex-shrink-0 text-lg font-medium sm:text-xl">
                        Driver Profiles
                    </Text>
                    <Text className="text-medium text-gray-400 mt-1">
                        Manage your vehicles and assign drivers
                    </Text>
                </Flex>

                {/* Button block */}
                <Flex className="w-full md:w-auto mt-4 md:mt-0" gap={10}>
                    <Button
                        type="primary"
                        danger
                        size={sm ? 'middle' : 'small'}
                        className="text-xs md:px-5 md:text-sm"
                        onClick={() => {
                            dispatch(resetResponse());
                            dispatch(resetInputParams());
                            navigate(`${paths.dashboard.turbo}/${paths.turbo.addDriver}`);
                        }}
                    >
                        <PlusOutlined />
                        Add Driver
                    </Button>
                    <Button
                        type="default"
                        danger
                        size={sm ? 'middle' : 'small'}
                        className="text-xs md:px-5 md:text-sm"
                        onClick={handleBulkUpload}
                    >
                        Bulk Upload
                    </Button>
                    <Button
                        type="default"
                        danger
                        size={sm ? 'middle' : 'small'}
                        className="text-xs md:px-5 md:text-sm"
                        onClick={() => downloadReport(DownloadType.Csv)}
                    >
                        Download
                    </Button>
                </Flex>
            </Flex>

            <Input
                className="mt-5 h-10"
                placeholder="Search with DL number"
                suffix={isLoading ? <LoadingOutlined spin /> : <SearchOutlined />}
                allowClear
                type="text"
                value={searchText}
                onChange={handleSearch}
            />
        </>
    );
};

export default ProfileHeatder;
