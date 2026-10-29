import React from 'react';

import { Flex, Layout, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Text } = Typography;

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <Layout.Footer
            style={{ paddingInline: 0, paddingBottom: 0 }}
            className="hidden pt-4 bg-white mt-14 md:block"
            id="footer-container"
        >
            <Flex gap={20}>
                <Text className="text-sm text-textBlack">
                    © {currentYear} Peko Platforms Private Limited. All Rights Reserved
                </Text>
                <Flex align="center" justify="end" className="flex-wrap ml-auto">
                    <Link
                        to="https://peko.one/in/platform-agreement"
                        target="_blank"
                        className="text-sm footerLink"
                        type="secondary"
                    >
                        <Text className="text-sm text-textBlack">Peko Platform Agreement</Text>
                    </Link>
                    <Divider />
                    <Link
                        to="https://peko.one/in/privacy-policy"
                        target="_blank"
                        className="text-sm footerLink"
                        type="secondary"
                    >
                        <Text className="text-sm text-textBlack">Privacy Policy</Text>
                    </Link>

                    <Divider />
                    <Link
                        to="https://peko.one/in/refund-policy"
                        target="_blank"
                        className="text-sm footerLink"
                        type="secondary"
                    >
                        <Text className="text-sm text-textBlack">Refund Policy</Text>
                    </Link>
                    <Divider />
                    <Link
                        to="https://peko.one/in/cookie-policy"
                        target="_blank"
                        className="text-sm footerLink"
                        type="secondary"
                    >
                        <Text className="text-sm text-textBlack">Cookie Policy</Text>
                    </Link>
                </Flex>
            </Flex>
        </Layout.Footer>
    );
};

const Divider = () => <span className="mx-2 text-gray-400">|</span>;

export default Footer;
