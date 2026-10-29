import { useState } from 'react';

import {
    DownloadOutlined,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Typography } from 'antd';
import '../assets/styles.css';
import { useNavigate } from 'react-router-dom';

import { useScrollToTop } from '@src/hooks/useScrollToTop';
import { paths } from '@src/routes/paths';

import UpdateEmployeeDrawer from '../components/drawers/UpdateEmployeeDrawer';
import AddBeneficiaryModal from '../components/modals/AddBeneficiaryModal';
import PayrollTable from '../components/PayrollTable';
import { useExportSalaryEmployees } from '../hooks/employeeSalaryHooks/salaryRolloutHooks/useExportSalaryEmployees';
import { useListSalaryRolloutEmployees } from '../hooks/employeeSalaryHooks/salaryRolloutHooks/useListSalaryRolloutEmployees';
import {
    getSalaryEmployeesColumns,
    SalaryEmployee,
} from '../utils/salaryEmployeesColumns/activeEmployees';

const { Text } = Typography;

const PAGE_SIZE = 10;
const SEARCH_MAX_LENGTH = 100;
const sanitizeEmployeeSearch = (value: string) =>
    value.replace(/[^A-Za-z0-9 @._+-]/g, '').slice(0, SEARCH_MAX_LENGTH);

const SalaryEmployeesTable = ({
    rows,
    total,
    isLoading,
    currentPage,
    onPageChange,
    onUpdate,
}: {
    rows: SalaryEmployee[];
    total: number;
    isLoading: boolean;
    currentPage: number;
    onPageChange: (page: number) => void;
    onUpdate: (record: SalaryEmployee) => void;
}) => {
    const columns = getSalaryEmployeesColumns(onUpdate);

    return (
        <>
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <PayrollTable
                    rowKey="key"
                    columns={columns?.map(x => {
                        if (x.key === 'action') {
                            x.width = '';
                        }
                        return x;
                    })}
                    dataSource={rows}
                    loading={isLoading}
                    pagination={false}
                    style={{ marginTop: 8, minWidth: 640 }}
                />
            </div>
            <Flex className="justify-center sm:justify-end" style={{ padding: '16px 24px' }}>
                <Pagination
                    current={currentPage}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={onPageChange}
                    showSizeChanger={false}
                    showLessItems
                />
            </Flex>
        </>
    );
};

const SalaryEmployees = (): JSX.Element => {
    useScrollToTop();
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<SalaryEmployee | null>(null);
    const { exportEmployees, isExporting } = useExportSalaryEmployees('active');

    const { rows, total, isLoading, refetch } = useListSalaryRolloutEmployees(
        searchText,
        currentPage,
        PAGE_SIZE
    );

    const handleUpdate = (record: SalaryEmployee) => setSelectedEmployee(record);

    const handlePageChange = (page: number) => setCurrentPage(page);

    const handleSearch = (value: string) => {
        setSearchText(sanitizeEmployeeSearch(value));
        setCurrentPage(1);
    };

    return (
        <Row gutter={[0, 32]} style={{ padding: '24px 16px 48px', width: '100%' }}>
            <Col span={24}>
                <Row gutter={[0, 12]} align="middle">
                    <Col xs={24} sm={12}>
                        <Text
                            className="text-2xl font-semibold"
                            style={{ color: '#101828', lineHeight: '32px' }}
                        >
                            Employees
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                        <Button
                            icon={<DownloadOutlined />}
                            loading={isExporting}
                            onClick={exportEmployees}
                            className="w-full sm:w-auto"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: '1px solid #FF4F4F',
                                color: '#FF4F4F',
                                fontSize: 14,
                            }}
                        >
                            Export
                        </Button>
                        <Button
                            type="primary"
                            danger
                            icon={<PlusOutlined />}
                            className="w-full sm:w-auto"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                background: '#FF4F4F',
                                borderColor: '#FF4F4F',
                                fontSize: 14,
                            }}
                            onClick={() => setShowBeneficiaryModal(true)}
                        >
                            Verify and add beneficiary
                        </Button>
                    </Col>
                </Row>
            </Col>

            <Col span={24}>
                <Row gutter={[0, 12]} align="middle">
                    <Col xs={24} sm={12}>
                        <Flex gap={12} wrap="wrap" style={{ width: '100%' }}>
                            <Button
                                className="flex-1 sm:flex-none"
                                style={{
                                    height: 36,
                                    borderRadius: 8,
                                    background: '#FFEDED',
                                    border: '1px solid #FF4F4F',
                                    color: '#FF4F4F',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    padding: '0 14px',
                                    boxShadow: 'none',
                                }}
                            >
                                Active employees
                            </Button>
                            <Button
                                className="flex-1 sm:flex-none"
                                style={{
                                    height: 36,
                                    borderRadius: 8,
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    color: '#FF4F4F',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    padding: '0 14px',
                                    boxShadow: 'none',
                                }}
                                onClick={() =>
                                    navigate(`/${paths.payroll.index}/${paths.payroll.salaryPastEmployees}`)
                                }
                            >
                                Past employees
                            </Button>
                        </Flex>
                    </Col>
                    <Col xs={24} sm={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Input
                            placeholder="Search by name, email or ID"
                            prefix={<SearchOutlined style={{ color: '#CBD5E1' }} />}
                            value={searchText}
                            onChange={e => handleSearch(e.target.value)}
                            allowClear
                            maxLength={SEARCH_MAX_LENGTH}
                            style={{
                                width: '100%',
                                maxWidth: 280,
                                height: 36,
                                borderRadius: 8,
                                border: '1px solid #E4E4E7',
                                fontSize: 13,
                            }}
                        />
                    </Col>
                </Row>
            </Col>

            <Col span={24}>
                <SalaryEmployeesTable
                    rows={rows}
                    total={total}
                    isLoading={isLoading}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    onUpdate={handleUpdate}
                />
            </Col>

            <AddBeneficiaryModal
                open={showBeneficiaryModal}
                onClose={() => setShowBeneficiaryModal(false)}
                onConfirm={() => { setShowBeneficiaryModal(false); refetch(); }}
            />

            <UpdateEmployeeDrawer
                open={!!selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                onSuccess={refetch}
                employee={selectedEmployee}
            />
        </Row>
    );
};

export default SalaryEmployees;
