import React from 'react';

import { Col, Flex, Grid, Row } from 'antd';
import { useNavigate } from 'react-router-dom';

import { serviceCategoryNames } from '@utils/accessKeys';
import { checkSubServiceAccessCorporate } from '@utils/checkAccess';

import BbpsIconCard from '../components/BbpsIconCard';
import IconCardMobile from '../components/IconCardMobile';
import { billPayments } from '../utils/data';

interface TelecomItem {
    icon: string;
    title: string;
    url: string;
}

const UtilityBillsList = () => {
    const navigate = useNavigate();
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const handleClick = (item: TelecomItem) => () => {
        navigate(item.url, { state: { item } });
    };
    const filteredbillPayments = billPayments.filter(item =>
        checkSubServiceAccessCorporate(serviceCategoryNames.utility, item.title)
    );

    return (
        <Flex vertical gap={40}>
            <Row gutter={[20, 30]}>
                {filteredbillPayments.map((item: TelecomItem, index) =>
                    screens.xs ? (
                        <IconCardMobile
                            icon={item.icon}
                            title={item.title}
                            onClick={handleClick(item)}
                            key={item.title}
                        />
                    ) : (
                        <React.Fragment key={index}>
                            <Col sm={6} md={4} xl={4} className="lg:mr-4">
                                <BbpsIconCard
                                    icon={item.icon}
                                    title={item.title}
                                    onClick={handleClick(item)}
                                />
                            </Col>
                        </React.Fragment>
                    )
                )}
            </Row>
        </Flex>
    );
};

export default UtilityBillsList;
