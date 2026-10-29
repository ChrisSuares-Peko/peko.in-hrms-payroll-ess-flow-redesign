import { Col, Row, Flex, Grid } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { useAppSelector } from '@src/hooks/store';
import { toServiceRoute } from '@utils/serviceRoute';


import Card from '../components/Card';

const MoreServices = () => {
    const screens = Grid.useBreakpoint();
    // const { subCorporateId } = useAppSelector(state => state.reducer.auth);
    // const isSubUser = Boolean(subCorporateId);

    const { services } = useAppSelector(state => state.reducer.services);

    // Driven entirely by the services stored in redux: show every accessible
    // service flagged `enableMoreService`, using the label + icon from the store.
    const moreServiceItems = (services?.data ?? [])
        .filter(item => item.enableMoreService && item.hasAccess)
        .map(item => ({
            title: item.alias || item.label,
            icon: item.icon ?? '',
            path: toServiceRoute(item.label, item.enableMoreService),
            status: '',
        }));
    return (
        <Content className="px-0">
            <Flex className=" mb-[2rem] text-[1.25rem] font-medium md:px-5 px-0">
                More Services
            </Flex>

            <Row gutter={screens.xs ? [20, 20] : [20, 40]}>
                {moreServiceItems.map((item, i) => (
                    <Col key={i} xs={6} sm={6} md={4} lg={6} xl={4} xxl={3}>
                        <Card
                            icon={item.icon}
                            title={item.title}
                           path={item.path}
                            status={item.status}
                        />
                    </Col>
                ))}
            </Row>
            {/*
            <Flex className=" mb-[2rem] text-[1.25rem] font-medium md:px-5 px-0 mt-5">
                Coming Soon
            </Flex>

            <Row gutter={screens.xs ? [20, 20] : [20, 40]}>
                {filteredComingSoon.map((item, i) => (
                    <Col key={i} xs={6} sm={6} md={4} lg={6} xl={4} xxl={3}>
                        <Card
                            icon={item.icon}
                            title={item.title}
                            path={item.path!}
                            status={item.status!}
                        />
                    </Col>
                ))}
            </Row>
            */}
        </Content>
    );
};

export default MoreServices;
