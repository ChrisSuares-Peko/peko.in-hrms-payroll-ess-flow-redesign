import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Flex, Table, Tag, Timeline, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { BRAdminApplication, BRPerson } from '../../api/businessRegistration';

const { Text } = Typography;

const STAGE_ICON: Record<string, React.ReactNode> = {
    done: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    failed: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    skipped: <MinusCircleOutlined style={{ color: '#d9d9d9' }} />,
};

const STAGE_TAG_COLOR: Record<string, string> = { done: 'green', failed: 'red' };

// vendorStages is an object stamped in completion order — display in chain
// order instead; unknown/future stages keep their position at the end.
// Actual run order: payment+engagement fire at OUR payment, smartform1 during
// director sync, the rest on final submit.
const STAGE_ORDER = [
    'lead', 'customer', 'payment', 'engagement', 'startup', 'people',
    'smartform1', 'shareholdings', 'moaAoa', 'documents', 'smartform2',
];
const stageRank = (key: string) => {
    const i = STAGE_ORDER.indexOf(key);
    return i === -1 ? STAGE_ORDER.length : i;
};

// Human-readable lines from a stage's meta — the documents stage records
// per-document upload results there; strings pass through as-is.
const stageMetaLines = (meta: unknown): string[] => {
    if (!meta) return [];
    if (typeof meta === 'string') return [meta];
    const { results } = meta as {
        results?: Array<{ docType?: string; status?: string; reason?: string }>;
    };
    if (!Array.isArray(results)) return [];
    return results
        .filter(r => r.status !== 'done')
        .map(r => `${r.docType ?? 'document'}: ${r.status}${r.reason ? ` — ${r.reason}` : ''}`);
};

type PersonRow = BRPerson & { role: string };

// The full form payload lives in applicationData (shape varies per entity) —
// pull the KYC people out of whichever section the entity uses.
export const extractPeople = (data: Record<string, unknown> = {}): PersonRow[] => {
    const rows: PersonRow[] = [];
    const push = (p: unknown, role: string) => {
        const person = p as BRPerson | undefined;
        if (person && (person.pan || person.firstName || person.fullName)) {
            rows.push({ role, ...person });
        }
    };
    (Array.isArray(data.directors) ? data.directors : []).forEach((p, i) =>
        push(p, `Director ${i + 1}`)
    );
    (Array.isArray(data.partners) ? data.partners : []).forEach((p, i) =>
        push(p, `Partner ${i + 1}`)
    );
    if (!rows.length) push(data.director, 'Director');
    push(data.nominee, 'Nominee');
    return rows;
};

const personColumns: ColumnsType<PersonRow> = [
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
        title: 'Name',
        key: 'name',
        render: (_, p) => p.fullName || `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '-',
    },
    { title: 'PAN', dataIndex: 'pan', key: 'pan', render: v => v || '-' },
    { title: 'DIN', dataIndex: 'din', key: 'din', render: v => v || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: v => v || '-' },
    { title: 'Mobile', dataIndex: 'mobile', key: 'mobile', render: v => v || '-' },
];

export const PeopleSection = ({ people }: { people: PersonRow[] }) => (
    <Table
        rowKey={r => `${r.role}-${r.pan ?? ''}`}
        columns={personColumns}
        dataSource={people}
        pagination={false}
        size="small"
        scroll={{ x: 700 }}
    />
);

export const DocumentsSection = ({ application }: { application: BRAdminApplication }) =>
    (application.documents?.length ?? 0) === 0 ? (
        <Text type="secondary">No documents uploaded.</Text>
    ) : (
        <Flex vertical gap={8}>
            {application.documents?.map(doc => (
                <Flex
                    key={`${doc.docType}-${doc.personKey ?? ''}`}
                    justify="space-between"
                    align="center"
                    className="border border-solid border-gray-200 rounded px-3 py-2"
                >
                    <Flex vertical>
                        <Text strong>{doc.docType.replace(/_/g, ' ')}</Text>
                        <Text type="secondary" className="text-xs">
                            {doc.fileName}
                            {doc.personKey ? ` — ${doc.personKey}` : ''}
                        </Text>
                    </Flex>
                </Flex>
            ))}
        </Flex>
    );

export const VendorTimeline = ({ application }: { application: BRAdminApplication }) => {
    const stages = Object.entries(application.vendorStages ?? {}).sort(
        ([a], [b]) => stageRank(a) - stageRank(b)
    );
    if (!stages.length) return <Text type="secondary">Not sent to the vendor yet.</Text>;
    return (
        <Timeline
            items={stages.map(([stage, info]) => ({
                dot: STAGE_ICON[info.status] ?? STAGE_ICON.skipped,
                children: (
                    <Flex vertical gap={2}>
                        <Flex align="center" gap={8}>
                            <Text strong>{stage}</Text>
                            <Tag color={STAGE_TAG_COLOR[info.status] ?? 'default'}>
                                {info.status}
                            </Tag>
                        </Flex>
                        {info.error && <Text type="danger">{info.error}</Text>}
                        {stageMetaLines(info.meta).map(line => (
                            <Text
                                key={line}
                                type={info.status === 'failed' ? 'danger' : 'secondary'}
                                className="text-xs"
                            >
                                {line}
                            </Text>
                        ))}
                        {info.at && (
                            <Text type="secondary" className="text-xs">
                                {formattedDateOnly(new Date(info.at))}{' '}
                                {formattedTime(new Date(info.at))}
                            </Text>
                        )}
                    </Flex>
                ),
            }))}
        />
    );
};
