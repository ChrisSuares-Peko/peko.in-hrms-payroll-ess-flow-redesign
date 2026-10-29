import { useEffect, useRef, useState } from 'react';

import { Button, Flex } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { fetchPersonalTemplateById } from '../api';
import SaveIcon from '../assets/icons/save.svg';
import DocumentEditor, { DocumentEditorHandle } from '../components/shared/DocumentEditor';
import DocumentPageSkeleton from '../components/shared/DocumentPageSkeleton';
import EditPreviewToggle from '../components/shared/EditPreviewToggle';
import useCreateDocument from '../hooks/useCreateDocument';
import useUpdateDocument from '../hooks/useUpdateDocument';

const PersonalDocumentPage = () => {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const editState = location.state as { documentId?: string; editorHtml?: string } | null;
    const isEditMode = !!editState?.documentId;

    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { saveDocument, isLoading: isSaving } = useCreateDocument();
    const { updateDocument, isLoading: isUpdating } = useUpdateDocument();

    const editorRef = useRef<DocumentEditorHandle>(null);
    const [template, setTemplate] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [headerMode, setHeaderMode] = useState<'edit' | 'preview'>('edit');

    useEffect(() => {
        if (!templateId) return;
        const load = async () => {
            setIsLoading(true);
            const data = await fetchPersonalTemplateById({ userId, userType: role, templateId });
            if (data) setTemplate(data);
            setIsLoading(false);
        };
        load();
    }, [templateId, userId, role]);

    const handleSave = async () => {
        if (!template) return;
        const editorHtml = editorRef.current?.getHtml() ?? '';
        if (!editorHtml.trim() || editorHtml === '<p></p>') {
            dispatch(
                showToast({ description: 'Document content cannot be empty', variant: 'error' })
            );
            return;
        }
        if (editorRef.current?.hasUnfilledPlaceholders()) {
            dispatch(
                showToast({
                    description: 'Please fill in all placeholders before saving',
                    variant: 'error',
                })
            );
            return;
        }
        if (isEditMode && editState?.documentId) {
            const result = await updateDocument({ documentId: editState.documentId, editorHtml });
            if (result) navigate(-1);
        } else {
            const result = await saveDocument({ title: template.title, editorHtml });
            if (result)
                navigate(
                    `/more-services/legal-service/document/${result.data?.id ?? result.id}/details`
                );
        }
    };

    if (isLoading) return <DocumentPageSkeleton />;

    if (!template) {
        return (
            <Flex justify="center" align="center" className="min-h-screen">
                <TypographyText className="text-gray-500 text-base font-['Roboto']">
                    Template not found.
                </TypographyText>
            </Flex>
        );
    }

    const initialHtml = editState?.editorHtml ?? template.html ?? '';

    return (
        <Flex vertical gap={36} className="pt-4 pb-10 bg-white min-h-screen">
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <TypographyText className="text-gray-900 text-2xl md:text-3xl font-semibold font-['Roboto'] leading-9 block">
                    {template.title}
                </TypographyText>

                <EditPreviewToggle mode={headerMode} onModeChange={setHeaderMode} />

                <Button
                    loading={isSaving || isUpdating}
                    onClick={handleSave}
                    icon={
                        !(isSaving || isUpdating) && (
                            <ReactSVG
                                src={SaveIcon}
                                beforeInjection={svg => {
                                    svg.setAttribute('style', 'width:16px;height:16px;');
                                    svg.setAttribute('stroke', 'white');
                                }}
                            />
                        )
                    }
                    className="h-10 !bg-[#FF3A3A] !border-[#FF3A3A] !text-white rounded-lg font-normal font-['Roboto'] text-base hover:!bg-[#e02020] hover:!border-[#e02020] flex items-center"
                >
                    Save
                </Button>
            </Flex>

            {/* Editor always mounted to preserve edits */}
            <div style={{ display: headerMode === 'edit' ? 'block' : 'none' }}>
                <DocumentEditor ref={editorRef} initialHtml={initialHtml} />
            </div>

            {/* Preview */}
            {headerMode === 'preview' && (
                <div
                    className="bg-gray-100 rounded-xl px-4 py-8 overflow-auto"
                    style={{ height: 'calc(100vh - 160px)' }}
                >
                    <style>{`
                        .doc-preview ul { list-style-type: disc; padding-left: 1.5em; }
                        .doc-preview ol { list-style-type: decimal; padding-left: 1.5em; }
                        .doc-preview li { margin: 2px 0; }
                        .doc-preview .page-break { border-top: 2px dashed #d1d5db; margin: 24px 0; position: relative; }
                        .doc-preview .page-break::after { content: 'Page Break'; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #f3f4f6; padding: 0 8px; font-size: 11px; color: #9ca3af; font-family: sans-serif; }
                    `}</style>
                    <div
                        className="doc-preview"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            background: '#fff',
                            boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
                            borderRadius: 4,
                            padding: '20mm 25mm',
                            fontFamily: '"Times New Roman", serif',
                            fontSize: '12pt',
                            lineHeight: 1.6,
                            color: '#111',
                            margin: '0 auto',
                        }}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                            __html: editorRef.current?.getHtml() ?? initialHtml,
                        }}
                    />
                </div>
            )}
        </Flex>
    );
};

export default PersonalDocumentPage;
