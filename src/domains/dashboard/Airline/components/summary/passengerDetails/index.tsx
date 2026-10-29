import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Row, Typography, Collapse } from 'antd';

import Passenger from './Passenger';
import { Passenger as PassengerType } from '../../../types/slices';

interface PassengerDetailsProps {
    passengers: PassengerType[];
}
const PassengerDetails = ({ passengers }: PassengerDetailsProps) => {
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
                    backgroundColor: '#F9F9F9',
                    borderRadius: '8px',
                }}
                expandIcon={customExpandIcon}
                items={items}
            />
        </div>
    );
};

export default PassengerDetails;
