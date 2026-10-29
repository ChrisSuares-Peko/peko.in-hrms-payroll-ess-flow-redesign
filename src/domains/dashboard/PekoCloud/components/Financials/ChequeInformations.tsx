import { Col, Row } from 'antd';

import UserInformation from './UserInformations';

type Props = {
    chequeLeafDetails: any;
    setRefState: (num: number) => void;
    isLoading: boolean;
};

const ChequeInformations = ({ chequeLeafDetails, setRefState, isLoading }: Props) => (
    <Row className="h-full ml-8 ">
        <Col xs={24} md={17}>
            <UserInformation
                isLoading={isLoading}
                setRefState={setRefState}
                chequeLeafDetails={chequeLeafDetails}
            />
        </Col>
    </Row>
);

export default ChequeInformations;
