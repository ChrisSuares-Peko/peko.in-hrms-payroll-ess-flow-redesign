import { Col, Row } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import EmployeeListMobile from './EmployeeListMobile';
import EmployeesTable from './EmployeesTable';

type Props = {
    setActiveTabKey: any;
};
const EmployeeList = ({ setActiveTabKey }: Props) => {
    const searchText = '';
    const screen = useScreenSize();

    return (
        <Row gutter={[10, 0]}>
            <Col span={24}>
                {screen.xs ? (
                    <EmployeeListMobile searchText={searchText} setActiveTabKey={setActiveTabKey} />
                ) : (
                    <EmployeesTable searchText={searchText} setActiveTabKey={setActiveTabKey} />
                )}
            </Col>
        </Row>
    );
};

export default EmployeeList;
