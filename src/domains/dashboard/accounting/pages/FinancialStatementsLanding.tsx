import { Col, Flex, Row } from 'antd';
import { useNavigate } from 'react-router-dom';

import FinancialStatementsHeader from '../sections/financialStatements/FinancialStatementsHeader';
import ReportGroup from '../sections/financialStatements/ReportGroup';
import { reportGroups } from '../utils/financialStatementsData';

const FinancialStatementsLanding = () => {
    const navigate = useNavigate();

    const handleOpenReport = (key: string) => {
        const report = reportGroups.flatMap(group => group.items).find(item => item.key === key);
        if (report?.path) navigate(report.path);
    };

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <FinancialStatementsHeader />

            <Row gutter={[32, 32]} className="w-full">
                {reportGroups.map(group => (
                    <Col key={group.key} xs={24} lg={12}>
                        <ReportGroup group={group} onOpen={handleOpenReport} />
                    </Col>
                ))}
            </Row>
        </Flex>
    );
};

export default FinancialStatementsLanding;
