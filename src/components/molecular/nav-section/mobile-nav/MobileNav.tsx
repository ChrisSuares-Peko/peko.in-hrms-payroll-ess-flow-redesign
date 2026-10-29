import { Col, Flex, Grid, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import useMobileNavData from './MobileNavData';

const { Text } = Typography;

const MobileNav = () => {
    const navData = useMobileNavData();
    const screens = Grid.useBreakpoint();
    return (
        <Row
            gutter={screens.xs ? [20, 20] : [20, 40]}
            className="w-full mt-3 mb-4"
            justify="center"
            align="middle"
        >
            {navData &&
                navData?.slice(0, 12)?.map((item, i) => (
                    <Col key={i} xs={6} sm={6} md={6} lg={6} xl={6} xxl={6}>
                        <Link to={item.key} key={item.key}>
                            <Flex vertical align="center" gap={8}>
                                <Flex
                                    align="center"
                                    justify="center"
                                    className=" w-[4.5rem] h-[4.5rem] rounded-2xl bg-[#FFF9F7]"
                                >
                                    <ReactSVG
                                        src={item.icon!}
                                        beforeInjection={svg => {
                                            svg.setAttribute('style', 'width: 40px; height: 40px;');
                                        }}
                                    />
                                </Flex>
                                <Text className=" text-[10px] h-8 max-w-[5rem] text-center font-medium">
                                    {item.label}
                                </Text>
                            </Flex>
                        </Link>
                    </Col>
                ))}
            {/* </Flex> */}
        </Row>
    );
};

export default MobileNav;
