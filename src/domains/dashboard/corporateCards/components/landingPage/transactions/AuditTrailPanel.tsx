import { Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';

import { AUDIT_TRAIL } from '../../../utils/transactionsData';
import { AuditEntry } from '../../../utils/types';
import SectionCard from '../../common/SectionCard';

const { Text } = Typography;

const columns: ColumnsType<AuditEntry> = [
    {
        key: 'date',
        title: 'Date',
        dataIndex: 'date',
        width: 140,
        render: (date: string) => <Text className="text-sm text-textBody">{date}</Text>,
    },
    {
        key: 'actor',
        title: 'Actor',
        dataIndex: 'actor',
        width: 200,
        render: (actor: string) => <Text className="text-sm text-textBody">{actor}</Text>,
    },
    {
        key: 'action',
        title: 'Action',
        dataIndex: 'action',
        render: (action: string) => <Text className="text-sm text-textHeadings">{action}</Text>,
    },
];

/** Transaction detail "Audit trail" panel: chronological actor/action log table. */
const AuditTrailPanel = () => (
    <SectionCard title="Audit trail">
        <div className="overflow-hidden rounded-xl border border-borderCard [&>div:first-child]:!mb-0 [&_.ant-table-tbody_.ant-table-cell]:!py-2">
            <GenericTable columns={columns} dataSource={AUDIT_TRAIL} rowKey="key" />
        </div>
    </SectionCard>
);

export default AuditTrailPanel;
