import { useEffect } from 'react';

import { Flex, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getGovtServicesListApi } from '../apis';
import HeroBanner from '../components/home/sections/HeroBanner';
import MyApplications from '../components/home/sections/MyApplications';
import ServiceCards from '../components/home/sections/ServiceCards';
import { mapApiItem } from '../hooks/useGovtServicesListApi';
import { setServicesList } from '../slices';

const { Title, Text } = Typography;

const GovernmentServicesHome = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector((state) => state.reducer.auth);
    const servicesList = useAppSelector((state) => state.reducer.governmentServices.servicesList);

    useEffect(() => {
        if (servicesList.length > 0) return;
        getGovtServicesListApi(id, role).then((data) => {
            dispatch(setServicesList(data.map(mapApiItem)));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role]);

    return (
        <Flex vertical gap={24} className="py-5 px-2">
            <Flex vertical gap={4}>
                <Title level={4} className="!mb-0">
                    Welcome Back
                </Title>
                <Text style={{ color: '#8C8C8C' }} className="text-sm">
                    Manage your business registrations and compliance
                </Text>
            </Flex>

            <HeroBanner />

            <ServiceCards />

            <MyApplications />
        </Flex>
    );
};

export default GovernmentServicesHome;
