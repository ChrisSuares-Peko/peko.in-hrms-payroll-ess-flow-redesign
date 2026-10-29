import { useState } from 'react';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { useScrollToTop } from '@src/hooks/useScrollToTop';
import { paths } from '@src/routes/paths';

import { updatePastEmployeeRemark } from '../api/employeeSalaryApi/salaryRolloutApi';
import SalaryBreakupModal from '../components/modals/SalaryBreakupModal';
import PayrollTable from '../components/PayrollTable';
import { useExportSalaryEmployees } from '../hooks/employeeSalaryHooks/salaryRolloutHooks/useExportSalaryEmployees';
import { useListSalaryRolloutPastEmployees } from '../hooks/employeeSalaryHooks/salaryRolloutHooks/useListSalaryRolloutPastEmployees';
import {
    getSalaryPastEmployeesColumns,
    PastEmployee,
} from '../utils/salaryEmployeesColumns/pastEmployees';

const { Text } = Typography;

const PAGE_SIZE = 10;

const PastEmployeesTable = ({
    rows,
    total,
    isLoading,
    currentPage,
    onPageChange,
    onViewBreakup,
    onSaveRemark,
}: {
    rows: PastEmployee[];
    total: number;
    isLoading: boolean;
    currentPage: number;
    onPageChange: (page: number) => void;
    onViewBreakup: (employeeId: string) => void;
    onSaveRemark: (employeeId: string, remark: string) => void;
}) => {
    const [remarks, setRemarks] = useState<Record<string, string>>({});
    const columns = getSalaryPastEmployeesColumns(remarks, setRemarks, onViewBreakup, onSaveRemark);

    return (
        <>
            <PayrollTable
                rowKey="key"
                columns={columns}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                scroll={{ x: 900 }}
                style={{ marginTop: 8 }}
            />
            <Flex justify="flex-end" style={{ padding: '16px 24px' }}>
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

const SalaryPastEmployees = () => {
    useScrollToTop();
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showSalaryBreakupModal, setShowSalaryBreakupModal] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const { exportEmployees, isExporting } = useExportSalaryEmployees('past');
    const { rows, total, isLoading } = useListSalaryRolloutPastEmployees(searchText, currentPage, PAGE_SIZE);
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const handleSaveRemark = async (employeeId: string, remark: string) => {
        await updatePastEmployeeRemark({ userId: String(id), userType: role, employeeId, remark });
    };

    const handleSearch = (value: string) => {
        setSearchText(value);
        setCurrentPage(1);
    };

    return (
        <Flex vertical gap={32} style={{ padding: '24px 16px 48px', width: '100%' }}>
            {/* Header */}
            <Flex justify="space-between" align="center">
                <Text style={{ fontSize: 24, fontWeight: 600, color: '#101828', lineHeight: '32px' }}>
                    Employees
                </Text>

                <Button
                    icon={<DownloadOutlined />}
                    loading={isExporting}
                    onClick={exportEmployees}
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
            </Flex>

            {/* Toggle buttons + Search row */}
            <Flex justify="space-between" align="center">
                <Flex gap={12}>
                    <Button
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
                        onClick={() => navigate(`/${paths.payroll.index}/${paths.payroll.salaryEmployees}`)}
                    >
                        Active employees
                    </Button>
                    <Button
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
                        Past employees
                    </Button>
                </Flex>
                <Input
                    placeholder="Search by name or ID"
                    prefix={<SearchOutlined style={{ color: '#CBD5E1' }} />}
                    value={searchText}
                    onChange={e => handleSearch(e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ''))}
                    allowClear
                    style={{
                        width: 280,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #E4E4E7',
                        fontSize: 13,
                    }}
                />
            </Flex>

            {/* Table Card */}
            <Flex
                vertical
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #EFF1F4',
                    borderRadius: 20,
                    width: '100%',
                    marginTop: -16,
                }}
            >
                <PastEmployeesTable
                    rows={rows}
                    total={total}
                    isLoading={isLoading}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onViewBreakup={(employeeId) => {
                        setSelectedEmployeeId(employeeId);
                        setShowSalaryBreakupModal(true);
                    }}
                    onSaveRemark={handleSaveRemark}
                />
            </Flex>

            <SalaryBreakupModal
                open={showSalaryBreakupModal}
                onClose={() => {
                    setShowSalaryBreakupModal(false);
                    setSelectedEmployeeId(null);
                }}
                employeeId={selectedEmployeeId}
            />
        </Flex>
    );
};

export default SalaryPastEmployees;
