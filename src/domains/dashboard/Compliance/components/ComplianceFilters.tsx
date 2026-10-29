import type { FC } from 'react';

import { Col, DatePicker, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import type { useComplianceFilter } from '../types';

const { RangePicker } = DatePicker;

interface ComplianceFiltersProps {
    filter: useComplianceFilter;
    onChange: (updated: Partial<useComplianceFilter>) => void;
}

const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Compliant', value: 'compliant' },
    { label: 'Non Compliant', value: 'non_compliant' },
    { label: 'In Review', value: 'in_review' },
];

const ComplianceFilters: FC<ComplianceFiltersProps> = ({ filter, onChange }) => (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
            <Input.Search
                placeholder="Search compliance..."
                defaultValue={filter.searchText}
                onSearch={(val) => onChange({ searchText: val, page: 1 })}
                allowClear
            />
        </Col>
        <Col xs={24} sm={12} md={6}>
            <Select
                style={{ width: '100%' }}
                options={statusOptions}
                value={filter.status}
                onChange={(val) => onChange({ status: val, page: 1 })}
                placeholder="Filter by status"
            />
        </Col>
        <Col xs={24} sm={12} md={8}>
            <RangePicker
                style={{ width: '100%' }}
                value={
                    filter.from && filter.to
                        ? [dayjs(filter.from), dayjs(filter.to)]
                        : undefined
                }
                onChange={(dates) =>
                    onChange({
                        from: dates?.[0]?.toISOString() ?? '',
                        to: dates?.[1]?.toISOString() ?? '',
                        page: 1,
                    })
                }
            />
        </Col>
    </Row>
);

export default ComplianceFilters;
