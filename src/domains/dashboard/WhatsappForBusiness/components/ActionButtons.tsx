import React from 'react';

import { Button, Flex } from 'antd';
import { Link } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

const ActionButtons = () => {
    const dispatch = useAppDispatch();

    const handleClick = () => {
        dispatch(
            showToast({
                description: 'Coming Soon',
                variant: 'info',
            })
        );
    };

    return (
        <Flex gap="small" justify="center">
            <Button key="back" onClick={handleClick} className="h-10 px-10" size="large" danger>
                Dashboard Tutorial
            </Button>
            <Link to={paths.whatsappForBusiness.reviewOrder}>
                <Button key="orderHistory" className="h-10 px-10" size="large" danger>
                    Order History
                </Button>
            </Link>
        </Flex>
    );
};

export default ActionButtons;
