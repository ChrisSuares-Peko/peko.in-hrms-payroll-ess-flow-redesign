import React from 'react';

import { CheckCircleFilled, WarningFilled } from '@ant-design/icons';
import { Table, Tooltip } from 'antd';

import { formatValueForCell } from './excelIO';
import { ColumnMapping, ImportInstance, RowValidation } from './types';

interface PreviewTableProps {
    mappings: ColumnMapping[];
    instances: ImportInstance[];
    rowValidations: RowValidation[];
    countryLabelById?: Record<string, string>;
}

/**
 * Import preview: one row per parsed instance with a valid/warning status icon
 * (invalid rows are flagged but never blocked — they can be fixed in the form
 * after importing).
 */
const PreviewTable: React.FC<PreviewTableProps> = ({
    mappings,
    instances,
    rowValidations,
    countryLabelById,
}) => {
    const columns = [
        {
            title: '',
            key: 'status',
            width: 48,
            render: (_: unknown, __: unknown, idx: number) => {
                const validation = rowValidations[idx];
                if (!validation || validation.valid) {
                    return <CheckCircleFilled style={{ color: '#52c41a' }} />;
                }
                return (
                    <Tooltip
                        title={
                            <span className="whitespace-pre-line">
                                {validation.errors.join('\n')}
                            </span>
                        }
                    >
                        <WarningFilled style={{ color: '#faad14' }} />
                    </Tooltip>
                );
            },
        },
        ...mappings.map(({ field }) => ({
            title: field.label,
            key: field._id,
            ellipsis: true,
            render: (_: unknown, record: ImportInstance) =>
                formatValueForCell(field, record[field.name], countryLabelById) || '-',
        })),
    ];

    return (
        <Table
            size="small"
            columns={columns}
            dataSource={instances.map((inst, idx) => ({ ...inst, key: idx }))}
            pagination={instances.length > 10 ? { pageSize: 10 } : false}
            scroll={{ x: true }}
        />
    );
};

export default PreviewTable;
