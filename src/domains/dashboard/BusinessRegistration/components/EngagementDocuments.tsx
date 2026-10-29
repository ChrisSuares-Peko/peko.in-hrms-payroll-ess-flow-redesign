import { useState } from 'react';

import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { viewApplicationDocument } from '../api';

const { Text } = Typography;

interface EngagementDoc {
    id: string;
    label: string;
    uploadedAt: string;
}

// Engagement documents — shape CONFIRMED 17-07 (vendor sample): entries carry
// `doc_id` (encrypted id for /docs/view), `document_type` (also in doc_info,
// e.g. "Form Agile Pro"), plus upload_info/file_info. Fallback keys kept for
// resilience. NOTE: the list includes documents WE uploaded to the engagement
// (service docs), not only vendor deliverables. The engagement is APPEND-ONLY
// on the vendor side (re-uploads pile up, no delete API) — display dedupes to
// the NEWEST copy per document type.
export const parseEngagementDocs = (documents: unknown[] | undefined | null): EngagementDoc[] => {
    const all = (documents || []).flatMap((entry, i): EngagementDoc[] => {
        if (typeof entry === 'string') {
            return [{ id: entry, label: `Document ${i + 1}`, uploadedAt: '' }];
        }
        if (entry && typeof entry === 'object') {
            const e = entry as Record<string, unknown>;
            const id = e.doc_id ?? e.docs_id ?? e.id ?? e.u;
            if (id == null) return [];
            const label =
                e.document_type ??
                (e.doc_info as Record<string, unknown> | undefined)?.document_type ??
                (e.file_info as Record<string, unknown> | undefined)?.original_filename ??
                `Document ${i + 1}`;
            const uploadedAt =
                (e.upload_info as Record<string, unknown> | undefined)?.upload_time ?? '';
            return [{ id: String(id), label: String(label), uploadedAt: String(uploadedAt) }];
        }
        return [];
    });
    const newestByLabel = new Map<string, EngagementDoc>();
    all.forEach(doc => {
        const current = newestByLabel.get(doc.label);
        if (!current || doc.uploadedAt > current.uploadedAt) newestByLabel.set(doc.label, doc);
    });
    return [...newestByLabel.values()];
};

interface EngagementDocumentsProps {
    applicationId: string;
    documents: unknown[] | undefined | null;
}

// Incorporation deliverables (COI etc.) — each row exchanges its vendor doc id
// for a short-lived signed URL and opens it in a new tab.
const EngagementDocuments = ({ applicationId, documents }: EngagementDocumentsProps) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const docs = parseEngagementDocs(documents);

    if (!docs.length) return null;

    const handleView = async (docId: string) => {
        setLoadingId(docId);
        const res = await viewApplicationDocument({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId,
            docId,
        });
        setLoadingId(null);
        if (res && typeof res === 'object' && res.signedUrl) {
            window.open(res.signedUrl, '_blank', 'noopener');
        }
    };

    return (
        <div className="border border-[#e4e4e7] rounded-[12px] p-4 flex flex-col gap-3">
            <Text className="!text-[15px] !font-semibold !text-[#1e293b]">
                Incorporation Documents
            </Text>
            {docs.map(doc => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 bg-[#fff2f2] rounded-[10px] w-[40px] h-[40px] flex items-center justify-center">
                            <FileTextOutlined className="text-[#ff4f4f]" style={{ fontSize: 18 }} />
                        </div>
                        <Text className="flex-1 min-w-0 !text-[14px] !text-[#1e293b]">{doc.label}</Text>
                    </div>
                    <Button
                        icon={<DownloadOutlined />}
                        loading={loadingId === doc.id}
                        onClick={() => handleView(doc.id)}
                        className="self-end sm:self-auto !h-[36px] !rounded-[8px] !text-[#ff4f4f] !border-[#ff4f4f]"
                    >
                        View
                    </Button>
                </div>
            ))}
        </div>
    );
};

export default EngagementDocuments;
