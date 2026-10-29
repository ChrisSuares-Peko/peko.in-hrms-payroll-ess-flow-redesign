import { Col, Row } from 'antd';

import { EmployeeProfile } from '../../../types/employeeprofile/type';
import BankDetails from '../BankDetails';

type Props = {
    employeeData: EmployeeProfile | false | undefined;
};
const BankTab = ({ employeeData }: Props) => (
    <Row>
        <Col md={24} xs={24}>
            <BankDetails employeeData={employeeData} />
        </Col>
    </Row>
);

export default BankTab;
