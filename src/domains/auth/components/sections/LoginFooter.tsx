import React from 'react';

import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Text } = Typography;

const LoginFooter = () => {
    const currentYear = new Date().getFullYear();
    return (
        <Flex justify="space-between" className="self-end hidden w-full px-10 pb-4 md:flex">
            <Text className="text-xs text-textGrey">
                © {currentYear} Peko Platforms Private Limited, All Rights Reserved
            </Text>
            <Flex gap={8}>
                <Link to="https://peko.one/in/platform-agreement" target="_blank">
                    <Text className="text-xs text-textGrey">Peko Platform Agreement |</Text>
                </Link>
                <Link to="https://peko.one/in/privacy-policy" target="_blank">
                    <Text className="text-xs text-textGrey">Privacy Policy |</Text>{' '}
                </Link>
                <Link to="https://peko.one/in/refund-policy" target="_blank">
                    <Text className="text-xs text-textGrey">Refund Policy |</Text>{' '}
                </Link>
                <Link to="https://peko.one/in/cookie-policy" target="_blank">
                    <Text className="text-xs text-textGrey">Cookie Policy</Text>
                </Link>
            </Flex>
        </Flex>
    );
};

export default LoginFooter;
