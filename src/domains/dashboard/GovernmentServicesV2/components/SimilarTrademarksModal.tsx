import { useMemo } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Input, Modal, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { SimilarTrademark } from '../apis';

interface SimilarTrademarksModalProps {
    open: boolean;
    onClose: () => void;
    searchTerm: string;
    results: SimilarTrademark[];
    classFilter: string;
    onClassFilterChange: (value: string) => void;
}

// Green for a clean registration, orange for contested; anything else (e.g. "Abandoned") falls back to neutral grey.
const STATUS_COLORS: Record<string, string> = {
    registered: '#16a34a',
    opposed: '#f97316',
    objected: '#f97316',
};
const statusColor = (status: string) => STATUS_COLORS[status.trim().toLowerCase()] ?? '#64748b';

// Backs Step 2's Brand field search icon — shows existing marks similar to the one being applied for.
const SimilarTrademarksModal = ({
    open,
    onClose,
    searchTerm,
    results,
    classFilter,
    onClassFilterChange,
}: SimilarTrademarksModalProps) => {
    const classOptions = useMemo(() => {
        const classes = Array.from(new Set(results.map((r) => r.class).filter(Boolean)));
        return [{ label: 'Select All', value: 'all' }, ...classes.map((c) => ({ label: c, value: c }))];
    }, [results]);

    const filteredResults = classFilter === 'all' ? results : results.filter((r) => r.class === classFilter);

    const columns: ColumnsType<SimilarTrademark> = [
        { title: 'Brand', dataIndex: 'tm_applied_for', key: 'brand' },
        { title: 'Class', dataIndex: 'class', key: 'class' },
        { title: 'Owner', dataIndex: 'proprietor_name', key: 'owner' },
        {
            title: 'Status',
            dataIndex: 'tm_status',
            key: 'status',
            render: (status: string) => <span style={{ color: statusColor(status) }}>{status}</span>,
        },
    ];

    return (
        <Modal open={open} onCancel={onClose} onOk={onClose} title="Similar Trademarks" width={900} footer={null}>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Input readOnly prefix={<SearchOutlined />} value={searchTerm} className="sm:max-w-xs" />
                <Select
                    value={classFilter}
                    onChange={onClassFilterChange}
                    options={classOptions}
                    className="sm:w-[180px]"
                />
            </div>
            <Table
                rowKey="application_no"
                columns={columns}
                dataSource={filteredResults}
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ x: true }}
            />
        </Modal>
    );
};

export default SimilarTrademarksModal;
