import { useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import ManageBooking from '../Components/BookingHistory/ManageBooking';
import useManageBokingsApi from '../hooks/useManageBookingApi';

const ManageBookingPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const { isLoading, data, bookings, refetch } = useManageBokingsApi(currentPage);

    return (
        <>
            <Flex justify="space-between" wrap="wrap">
                <Typography.Text className="text-xl font-medium">
                    Manage Your Bookings
                </Typography.Text>
                <Link to={`/${paths.needHelp.index}`}>
                    <Typography.Text>
                        <QuestionCircleOutlined className="px-1" />
                        Support
                    </Typography.Text>
                </Link>
            </Flex>

            <ManageBooking
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isLoading={isLoading}
                data={data}
                bookings={bookings}
                refetch={refetch}
            />
        </>
    );
};

export default ManageBookingPage;
