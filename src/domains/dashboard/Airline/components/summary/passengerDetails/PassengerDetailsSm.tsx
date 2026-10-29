import { Row } from 'antd';

import PassengerSm from './PassengerSm';
import { Passenger } from '../../../types/slices';

interface PassengerDetailsProps {
    passengers: Passenger[];
}
const PassengerDetailsSm = ({ passengers }: PassengerDetailsProps) => (
    <div>
        <Row gutter={[16, 16]}>
            {passengers.map((passenger, index: number) => (
                <PassengerSm key={index} index={index} passenger={passenger} />
            ))}
        </Row>
    </div>
);

export default PassengerDetailsSm;
