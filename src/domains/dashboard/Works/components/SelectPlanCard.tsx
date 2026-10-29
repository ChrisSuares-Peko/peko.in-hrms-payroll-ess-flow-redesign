import { Typography, Button, List, Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { PlanType } from '../type';

const SelectPlanSectionCard = ({ title, amount, features, monthlyCost }: PlanType) => (
    <Content className="bg-white rounded-xl border border-solid border-gray-300 h-full p-9 flex flex-col justify-between">
        <Flex vertical gap={20}>
            <Typography.Title level={2}>{title}</Typography.Title>
            <Typography.Title level={2}>{`₹ ${amount}`}</Typography.Title>
            <Typography.Paragraph className="text-gray-400">{monthlyCost}</Typography.Paragraph>
            <List
                size="large"
                dataSource={features}
                className="my- p-0"
                renderItem={item => (
                    <List.Item className="bullet" style={{ padding: '0.6rem 0' }}>
                        &#8226; {item}
                    </List.Item>
                )}
            />
        </Flex>
        <Link to={`/${paths.works.index}/${paths.works.purchased}`}>
            <Button danger type="primary" className="w-2/3 mt-4">
                Purchase
            </Button>
        </Link>
    </Content>
);

export default SelectPlanSectionCard;
