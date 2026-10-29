import { Col, Row } from 'antd';

import ChequeBookUserInformations from './ChequeBookUserInformations';

type Props = {
    chequeBookData: any;
    setRefState: (num: number) => void;
    isLoading: boolean;
    data?: any;
};

const ChequeBookInformation = ({ chequeBookData, setRefState, isLoading, data }: Props) => (
    <Row className="h-full ">
        <Col className="" xs={24}>
            <ChequeBookUserInformations
                isLoading={isLoading}
                setRefState={setRefState}
                chequeBookData={chequeBookData}
            />
        </Col>
    </Row>
);

export default ChequeBookInformation;
