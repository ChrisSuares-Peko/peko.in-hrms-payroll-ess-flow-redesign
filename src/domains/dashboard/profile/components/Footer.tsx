import React from 'react';

import { Layout, Typography, Row, Col } from 'antd';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <Layout.Footer
            className="block md:hidden bg-white py-4 mt-8"
            style={{ paddingLeft: 0, paddingRight: 0 }}
        >
            <Row justify="center" gutter={[10, 10]} className="text-center">
                <Col>
                    <Link
                        to="https://peko.one/in/platform-agreement"
                        target="_blank"
                        className="text-gray-500 text-xs hover:text-gray-700 transition"
                    >
                        Terms of Use
                    </Link>
                </Col>
                <Col>
                    <Link
                        to="https://peko.one/in/privacy-policy"
                        target="_blank"
                        className="text-gray-500 text-xs hover:text-gray-700 transition"
                    >
                        Privacy Policy
                    </Link>
                </Col>
                <Col>
                    <Link
                        to="https://peko.one/in/refund-policy"
                        target="_blank"
                        className="text-gray-500 text-xs hover:text-gray-700 transition"
                    >
                        Refund Policy
                    </Link>
                </Col>
                <Col>
                    <Link
                        to="https://peko.one/in/cookie-policy"
                        target="_blank"
                        className="text-gray-500 text-xs hover:text-gray-700 transition"
                    >
                        Cookie Policy
                    </Link>
                </Col>
            </Row>
            <Row justify="center" className="mt-4 text-center">
                <Col span={24}>
                    <Typography.Text className="text-gray-400 text-xs">
                        © {currentYear} Peko Platforms Private Limited. All Rights Reserved
                    </Typography.Text>
                </Col>
            </Row>
        </Layout.Footer>
    );
};

export default Footer;
