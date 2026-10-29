import React, { useCallback } from 'react';

import { Col, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import IconCard from '@components/molecular/cards/IconCard';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { quickActions } from '@utils/data';

type QuickActionsListProps = {
    quickAction?: React.MutableRefObject<null>;
};
const { Text } = Typography;

const QuickActionsList = ({ quickAction }: QuickActionsListProps) => {
    const { services } = useAppSelector(state => state.reducer.subscriptions);
    const navigate = useNavigate();
    const { xl } = useScreenSize();
    const justify = xl ? 'space-between' : 'start';
    const handleClick = useCallback(
        ({ url, state, accessKey, indexURL }: any) =>
            () => {
                if (accessKey && services) {
                    const isPurchased = services.userAccessibleServices.includes(accessKey);
                    if (!isPurchased) return navigate(indexURL);
                }
                return navigate(url, { state: { item: state } });
            },
        [navigate, services]
    );
    return (
        <Row gutter={[20, 20]} className="mt-3 md:pr-2" justify={justify} ref={quickAction}>
            <Col span={24}>
                <Text className="text-lg font-medium text-black">Quick Actions</Text>
            </Col>
            {quickActions.map((item, index) => (
                <Col key={index} className="mt-3" xs={8} md={4}>
                    <IconCard
                        icon={item.icon}
                        imageSize={item.imageSize}
                        title={item.title}
                        key={item.icon}
                        onClick={handleClick(item)}
                    />
                </Col>
            ))}
        </Row>
    );
};

export default React.memo(QuickActionsList);
