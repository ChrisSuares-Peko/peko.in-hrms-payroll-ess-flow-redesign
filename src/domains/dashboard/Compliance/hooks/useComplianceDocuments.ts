import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getComplianceListApi } from '../api';

export interface ComplianceDocumentItem {
    id: string;
    name: string;
    category: string;
    date: string;
    url: string;
}

export interface ComplianceDocumentGroup {
    id: string;
    label: string;
    documents: ComplianceDocumentItem[];
}

function getFiscalYear(dateStr: string): string {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return month >= 4 ? `${year}-${String(year + 1).slice(2)}` : `${year - 1}-${String(year).slice(2)}`;
}

const useComplianceDocuments = (searchText: string = '') => {
    const { id: userId, role: userType } = useAppSelector((state) => (state.reducer as any).auth);
    const [groups, setGroups] = useState<ComplianceDocumentGroup[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const res = await getComplianceListApi({
                userId,
                userType,
                searchText,
                page: 1,
                pageSize: 1000,
                from: '',
                to: '',
            });

            if (res) {
                const groupMap = new Map<string, ComplianceDocumentGroup>();

                res.rows.filter((compliance) => !!compliance.documents?.length).forEach((compliance) => {
                    const groupId = compliance.category === 'one-time'
                        ? 'one-time'
                        : getFiscalYear(compliance.dueDate ?? compliance.updatedAt ?? compliance.createdAt);
                    const groupLabel = compliance.category === 'one-time' ? 'One-time Compliances' : groupId;

                    if (!groupMap.has(groupId)) {
                        groupMap.set(groupId, { id: groupId, label: groupLabel, documents: [] });
                    }

                    const group = groupMap.get(groupId)!;

                    compliance.documents.forEach((doc) => {
                        group.documents.push({
                            id: String(doc.id),
                            name: doc.name,
                            category: compliance.title,
                            date: new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            }),
                            url: doc.url,
                        });
                    });
                });

                // Order: one-time first, then fiscal years descending
                const sorted = [...groupMap.values()].sort((a, b) => {
                    if (a.id === 'one-time') return -1;
                    if (b.id === 'one-time') return 1;
                    return b.id.localeCompare(a.id);
                });

                setGroups(sorted);
            }

            setLoading(false);
        };

        fetch();
    }, [userId, userType, searchText]);

    return { groups, loading };
};

export default useComplianceDocuments;
