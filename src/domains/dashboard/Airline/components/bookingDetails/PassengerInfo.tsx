import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Row, Typography, Collapse } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import Passenger from './Passenger';

interface PassengerDetailsProps {}
const PassengerInfo: React.FC<PassengerDetailsProps> = () => {
    const { passengers } = useAppSelector(state => state.reducer.airline.orderDetails);

    const customExpandIcon = (panelProps: { isActive?: boolean }) =>
        panelProps.isActive ? <DownOutlined /> : <RightOutlined />;

    const items = [
        {
            key: '1',
            label: (
                <Typography.Title level={5} style={{ margin: 0 }}>
                    Passenger Details
                </Typography.Title>
            ),
            children: (
                <Row gutter={[16, 16]}>
                    {passengers.map((passenger, index: number) => (
                        <Passenger key={index} index={index} passenger={passenger} />
                    ))}
                </Row>
            ),
        },
    ];

    return (
        <div>
            <Collapse
                defaultActiveKey={['1']}
                expandIconPosition="end"
                style={{
                    backgroundColor: '#F5F5F5',
                    borderRadius: '8px',
                    border: 'none',
                }}
                expandIcon={customExpandIcon}
                items={items}
            />
        </div>
    );
};

export default PassengerInfo;
