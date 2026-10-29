/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';

import { Grid, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { useAppSelector } from '@src/hooks/store';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { accessKeys } from '@utils/accessKeys';

import UserDetailsWeb from '../Components/GuestDetails/UserDetailsWeb';
import DateFields from '../hooks/useDateField';
import { useGetEmployee } from '../hooks/useGetEmploeeApi';
import { cancelpolicyRoom } from '../types/cancellationTypes';
import { HotelSearch } from '../types/hotelTypes';


const { useBreakpoint } = Grid;
const UserDetails = () => {
    const screens = useBreakpoint();
    const { showModal, isModalOpen, handleCancel } = DateFields();
    const { keyData, hotelResponse, reservedData } = useAppSelector(state => state.reducer.hotels);
    const [policy, setPolicy] = useState<cancelpolicyRoom[]>([]);
    const response = hotelResponse as HotelSearch;

    const bookArr = reservedData.map(value => ({
        roomKey: value.roomKey,
        roomIndex: value.roomIndex,
    }));

       const isPurchasedPayroll = useServiceAccess(accessKeys.payroll);
    const { data: employeesList, generateEmployeesDropdown,isLoading  } = useGetEmployee(isPurchasedPayroll);
   
    return (
        <Content>
            {screens.md ? (
                <>
          
                    <Typography.Text className="font-medium" style={{ fontSize: '1.3rem' }}>
                        Guest Details
                    </Typography.Text>

                    <UserDetailsWeb
                    employeesList={employeesList}
                    generateEmployeesDropdown={generateEmployeesDropdown}
                    isLoading={isLoading}
                    />
                </>
            ) : (
              
                    <UserDetailsWeb
                    employeesList={employeesList}
                    generateEmployeesDropdown={generateEmployeesDropdown}
                    isLoading={isLoading}
                    />
              
            )}
        </Content>
    );
};

export default UserDetails;
