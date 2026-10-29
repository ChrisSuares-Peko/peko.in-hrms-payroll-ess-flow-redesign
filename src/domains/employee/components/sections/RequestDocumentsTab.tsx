import React, { useEffect, useState } from 'react';

import { CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

import RequestDocumentModal from './RequestDocumentModal';
import documentVault from '../../assets/icons/documentVault.svg';
import { useDocumentRequests } from '../../hooks/useDocumentRequests';

const { Text } = Typography;

interface RequestItem {
    title: string;
    fieldLabel?: string;
    fieldPlaceholder?: string;
}

const requestItems: RequestItem[] = [
    { title: 'Salary Certificate' },
    { title: 'Bank Verification Letter' },
    { title: 'Employment Verification Letter' },
    { title: 'Experience Letter' },
    { title: 'Relieving Letter' },
    { title: 'Address Proof Letter' },
    {
        title: 'NOC Request',
        fieldLabel: 'Purpose',
        fieldPlaceholder: 'e.g. for visa, new employment...',
    },
    { title: 'Form 16' },
    {
        title: 'Others',
        fieldLabel: 'Document Name',
        fieldPlaceholder: 'Enter the document you need',
    },
];

const RequestDocumentsTab: React.FC = () => {
    const { requests, fetchRequests, requestDocument } = useDocumentRequests();
    const [submittingType, setSubmittingType] = useState<string | null>(null);
    const [modalItem, setModalItem] = useState<RequestItem | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleRequest = async (item: RequestItem) => {
        if (item.fieldLabel) {
            setModalItem(item);
            return;
        }
        setSubmittingType(item.title);
        await requestDocument(item.title);
        setSubmittingType(null);
    };

    const handleModalSubmit = async (value: string) => {
        if (!modalItem) return false;
        setSubmittingType(modalItem.title);
        const ok = await requestDocument(modalItem.title, value);
        setSubmittingType(null);
        if (ok) setModalItem(null);
        return ok;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-2">
            {requestItems.map(item => {
                const pending = requests.some(r => r.documentType === item.title);
                return (
                    <div
                        key={item.title}
                        className="bg-white rounded-3xl p-6 border border-[#e4e7ec] flex flex-col items-center text-center gap-3 min-h-[170px]"
                    >
                        <img src={documentVault} alt="" className="h-11 mb-3" />
                        <Text className="text-valueText font-semibold text-base block">
                            {item.title}
                        </Text>

                        <div className="w-full mt-auto">
                            {pending ? (
                                <Button
                                    block
                                    disabled
                                    icon={<CheckCircleOutlined />}
                                    className="h-[40px] rounded-lg font-medium"
                                    style={{ color: '#26A411', borderColor: '#B7EB8F' }}
                                >
                                    Requested
                                </Button>
                            ) : (
                                <Button
                                    block
                                    loading={submittingType === item.title}
                                    onClick={() => handleRequest(item)}
                                    className="h-[40px] rounded-lg font-medium flex items-center justify-center gap-2"
                                    style={{ color: '#FF4F4F', borderColor: '#FF4F4F' }}
                                >
                                    <span>Request</span>
                                    <SendOutlined />
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}

            <RequestDocumentModal
                open={modalItem !== null}
                documentType={modalItem?.title ?? ''}
                fieldLabel={modalItem?.fieldLabel ?? ''}
                fieldPlaceholder={modalItem?.fieldPlaceholder}
                onCancel={() => setModalItem(null)}
                onSubmit={handleModalSubmit}
            />
        </div>
    );
};

export default RequestDocumentsTab;
