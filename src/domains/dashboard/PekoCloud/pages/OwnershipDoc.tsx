import { Col, Row, Tabs, TabsProps } from 'antd';
import { Content } from 'antd/es/layout/layout';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

import OwnersDetails from '../components/OwnershipDoc/OwnersDetails';

const OwnershipDoc = () => {
    useHideWidgetOnDrawer(true);
    useScrollToTop();
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: "Owner's Details",
            children: <OwnersDetails />,
        },
        // {
        //     key: '2',
        //     label: 'Investment Details',
        //     children: <Flex>Investment Details</Flex>,
        //     disabled: true,
        // },
    ];
    return (
        <Content>
            <Row>
                <Col xs={24} className="mt-5">
                    <Tabs defaultActiveKey="1" items={items} />
                </Col>
            </Row>
        </Content>
    );
};

export default OwnershipDoc;
