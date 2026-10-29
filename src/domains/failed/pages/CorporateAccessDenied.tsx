import React from 'react';

import { Button, Empty, Flex, Grid, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import NoServiceFound from '@assets/images/Access-Denied.png';
import { paths } from '@src/routes/paths';

const { useBreakpoint } = Grid;

const CorporateAccessDenied = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const height = screens.md ? 250 : 'auto';
    const maxWidth = screens.md ? '100%' : '80%';
    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={15}
            className="px-5 text-center md:px-0"
        >
            <Empty
                image={NoServiceFound}
                imageStyle={{
                    height,
                        maxWidth,
                        maxHeight: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                        objectFit: 'contain',
                        margin: '0 auto',
                }}
                description={
                    <Typography.Text>
                        {' '}
                        Sorry, you do not have permission to access this page. For assistance,
                        kindly reach out to our support team.
                    </Typography.Text>
                }
            />
            <Button
                type="default"
                className="mt-2"
                danger
                onClick={() => navigate(paths.dashboard.home)}
            >
                Go to Dashboard
            </Button>
        </Flex>
    );
};

export default CorporateAccessDenied;
