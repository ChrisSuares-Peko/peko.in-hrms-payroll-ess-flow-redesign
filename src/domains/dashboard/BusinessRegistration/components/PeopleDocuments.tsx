import { FileTextOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

import { ApplicationStatus } from '../api';

const { Text } = Typography;

type PeopleDoc = NonNullable<
    NonNullable<ApplicationStatus['peopleDocuments']>[number]['documents']
>[number];

// Keep the newest copy per document type (re-uploads pile up vendor-side).
const dedupe = (docs: PeopleDoc[]): PeopleDoc[] => {
    const newest = new Map<string, PeopleDoc>();
    docs.forEach(doc => {
        const key = doc.documentType || doc.fileName || doc.docId || '';
        const current = newest.get(key);
        if (!current || (doc.uploadedAt || '') > (current.uploadedAt || '')) newest.set(key, doc);
    });
    return [...newest.values()];
};

// KYC documents grouped by person; each row opens the vendor's public doc_link.
const PeopleDocuments = ({ people }: { people: ApplicationStatus['peopleDocuments'] }) => {
    const groups = (people || []).filter(p => p.documents?.length);
    if (!groups.length) return null;

    return (
        <div className="border border-[#e4e4e7] rounded-[12px] p-4 flex flex-col gap-4">
            <Text className="!text-[15px] !font-semibold !text-[#1e293b]">KYC Documents</Text>
            {groups.map(person => (
                <div key={String(person.peopleId)} className="flex flex-col gap-2">
                    {person.name && (
                        <Text className="!text-[13px] !font-medium !text-[#475569]">{person.name}</Text>
                    )}
                    {dedupe(person.documents || []).map(doc => (
                        <div key={doc.docId || doc.docLink || doc.documentType} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex-shrink-0 bg-[#fff2f2] rounded-[10px] w-[40px] h-[40px] flex items-center justify-center">
                                    <FileTextOutlined className="text-[#ff4f4f]" style={{ fontSize: 18 }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Text className="!block !text-[14px] !text-[#1e293b]">
                                        {doc.documentType || doc.fileName || 'Document'}
                                    </Text>
                                    {doc.fileName && doc.documentType && (
                                        <Text className="!block !text-[12px] !text-[#94a3b8] truncate">
                                            {doc.fileName}
                                        </Text>
                                    )}
                                </div>
                            </div>
                            {doc.docLink && (
                                <Button
                                    icon={<LinkOutlined />}
                                    onClick={() => window.open(doc.docLink as string, '_blank', 'noopener')}
                                    className="self-end sm:self-auto !h-[36px] !rounded-[8px] !text-[#ff4f4f] !border-[#ff4f4f]"
                                >
                                    View
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default PeopleDocuments;
