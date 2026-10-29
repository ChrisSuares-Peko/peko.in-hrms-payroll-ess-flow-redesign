import { useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Col, Row, Select, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { yearsCurrentAndPrev } from '@utils/yearData';

import { downloadPayrollHistoryReport } from '../../api/salaryHistoryApi/salaryHistoryDetail';
import { useExportPayrollHistoryApi } from '../../hooks/employeeSalaryHooks/salaryTableHooks/useExportPayrollHistoryApi';
import { useGetPayrollHistory } from '../../hooks/employeeSalaryHooks/salaryTableHooks/useGetPayrollHistory';
import { getPayrollHistoryColumns } from '../../utils/salaryTable/data';

function PayrollHistoryTab() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const { tableDatas, tableLoading } = useGetPayrollHistory(selectedYear);
    const { exportLoading, exportPayrollHistory } = useExportPayrollHistoryApi();

    const handleView = (record: any) => {
        navigate(`/${paths.payroll.index}/${paths.payroll.payrollHistoryView}`, {
            state: { record },
        });
    };

    const handleDownload = async (record: any) => {
        setDownloadingId(record.id);
        await downloadPayrollHistoryReport(corporateId, record.monthNumber, record.year);
        setDownloadingId(null);
    };

    const handleExport = async () => {
        const response = await exportPayrollHistory(selectedYear);
        dispatch(
            showToast({
                variant: response.status ? 'success' : 'error',
                description: response.message,
            })
        );
    };

    return (
        <Row gutter={[16, 20]} className="w-m">
            <Row gutter={[10, 10]} className="w-full" justify="end">
                <Col md={3} xs={24} className="">
                    <Select
                        className="w-full"
                        value={selectedYear}
                        onChange={value => setSelectedYear(value)}
                        options={yearsCurrentAndPrev}
                    />
                </Col>
                <Col md={3} xs={24}>
                    <Button
                        icon={<DownloadOutlined />}
                        className="w-full"
                        loading={exportLoading}
                        onClick={handleExport}
                    >
                        Export
                    </Button>
                </Col>
            </Row>
            <Col md={24}>
                <GenericTable
                    dataSource={tableDatas}
                    columns={getPayrollHistoryColumns(handleView, handleDownload, downloadingId)}
                    rowKey="id"
                    loading={tableLoading}
                    pagination={false}
                />
            </Col>
        </Row>
    );
}

export default PayrollHistoryTab;
