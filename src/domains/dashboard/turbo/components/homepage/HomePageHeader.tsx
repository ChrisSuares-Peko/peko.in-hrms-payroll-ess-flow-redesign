import React, { useEffect, useState } from 'react';

import { Button, Flex, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import useDashboard from '../../hooks/useDashboard';

const { Text } = Typography;
interface headerProps {
    latestUpdatedAt: string
}
const HomePageHeader = ({ latestUpdatedAt }: headerProps) => {
    const [updatedTime, setUpdatedTime] = useState(latestUpdatedAt)
    useEffect(() => {
        setUpdatedTime(updatedTime);
      }, [updatedTime]);
    const navigate = useNavigate();
    const { sm } = useScreenSize();
    const dispatch = useDispatch();
    const isRefresh = false;
    const { refreshData, isRefreshLoading, setRefresh } = useDashboard(isRefresh);

    const handleSubmit = async () => {
        const res = await refreshData();
        if (res.refresh) {
            setRefresh(true);
            setUpdatedTime(res.updatedAt);
            dispatch(
                showToast({
                    description: 'Data refreshed successfully',
                    variant: 'success',
                })
            );
        }
    };

    return (
        <Flex className="flex-col mt-3 sm:flex-row md:justify-between md:mt-0">

            <Flex vertical>
                <Text className="flex-shrink-0 text-lg font-medium sm:text-xl">Turbo </Text>

                <Text className="mt-1 text-gray-400 text-medium">
                    Instantly verify RC and DL details, recharge FASTag, and manage your fleet-all
                    in one place.
                </Text>
            </Flex>

            <Flex className="align-middle xs:mt-2 md:mt-0" gap={10}>
                <Button
                    type="default"
                    danger
                    size={sm ? 'middle' : 'small'}
                    className="text-xs md:px-5 md:text-sm"
                    onClick={() => navigate(paths.turbo.operationLog)}
                >
                    Operations Log
                </Button>

                <Flex vertical>
                    <Button
                        type="default"
                        danger
                        size={sm ? 'middle' : 'small'}
                        className="text-xs md:px-5 md:text-sm"
                        onClick={handleSubmit}
                        loading={isRefreshLoading}
                    >
                        Refresh Data
                    </Button>
                    {
                        updatedTime && (
                            <Text className="text-[0.6rem] mt-2 text-gray-400">
                                Last Updated {formattedDateOnly(new Date(updatedTime))}, {formattedTime(new Date(updatedTime))}
                            </Text>

                        )
                    }

                </Flex>
            </Flex>
        </Flex>
    );
};

export default HomePageHeader;
