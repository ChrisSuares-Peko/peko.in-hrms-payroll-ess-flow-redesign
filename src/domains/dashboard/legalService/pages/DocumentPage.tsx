import { useRef, useState } from 'react';

import { Button, Flex, Input } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { savePersonalTemplate } from '../api';
import TemplateIcon from '../assets/icons/save-add.svg';
import SaveIcon from '../assets/icons/save.svg';
import DocumentEditor, { DocumentEditorHandle } from '../components/shared/DocumentEditor';
import DocumentPageSkeleton from '../components/shared/DocumentPageSkeleton';
import EditPreviewToggle from '../components/shared/EditPreviewToggle';
import useCreateDocument from '../hooks/useCreateDocument';
import useTemplateDetail from '../hooks/useTemplateDetail';
import useUpdateDocument from '../hooks/useUpdateDocument';

const DocumentPage = () => {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const editState = location.state as {
        documentId?: string;
        editorHtml?: string;
        title?: string;
    } | null;
    const isEditMode = !!editState?.documentId;

    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const editorRef = useRef<DocumentEditorHandle>(null);
    const [headerMode, setHeaderMode] = useState<'edit' | 'preview'>('edit');
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    // Only load template when creating (not in edit mode)
    const { template, isLoading } = useTemplateDetail(isEditMode ? '' : (templateId ?? ''));
    const { saveDocument, isLoading: isSaving } = useCreateDocument();
    const { updateDocument, isLoading: isUpdating } = useUpdateDocument();

    const pageTitle = isEditMode ? (editState?.title ?? '') : (template?.title ?? '');
    const initialHtml = isEditMode ? (editState?.editorHtml ?? '') : (template?.html ?? '');

    const handleSave = async () => {
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
            if (!template) return;
            const result = await saveDocument({ title: template.title, editorHtml });
            if (result)
                navigate(
                    `/more-services/legal-service/document/${result.data?.id ?? result.id}/details`
                );
        }
    };

    const handleSaveAsTemplate = async (formValues: { title: string }, formikHelpers?: any) => {
        if (!formValues.title.trim()) {
            formikHelpers?.setFieldError('title', 'Please enter template name');
            return;
        }
        const html = editorRef.current?.getHtml() ?? '';
        if (!html.trim() || html === '<p></p>') {
            dispatch(
                showToast({
                    description: 'Please add some content before saving as template',
                    variant: 'error',
                })
            );
            return;
        }
        setIsSavingTemplate(true);
        const result = await savePersonalTemplate({
            userId,
            userType: role,
            title: formValues.title.trim(),
            iconKey: template?.iconKey,
            category: template?.category,
            timeEstimate: template?.timeEstimate,
            html,
        });
        setIsSavingTemplate(false);
        if (result) {
            dispatch(showToast({ description: 'Template saved successfully', variant: 'success' }));
            setSaveModalOpen(false);
        } else {
            dispatch(showToast({ description: 'Failed to save template', variant: 'error' }));
        }
    };

    // Show skeleton only when loading a new template (not in edit mode)
    if (!isEditMode && isLoading) return <DocumentPageSkeleton />;

    if (!isEditMode && !template) {
        return (
            <Flex justify="center" align="center" className="min-h-screen">
                <TypographyText className="text-gray-500 text-base font-['Roboto']">
                    Template not found.
                </TypographyText>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={36} className="pt-4 pb-10 bg-white min-h-screen">
            {/* Page header */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <TypographyText className="text-gray-900 text-2xl font-semibold font-['Roboto'] leading-8 block">
                    {pageTitle}
                </TypographyText>

                <EditPreviewToggle mode={headerMode} onModeChange={setHeaderMode} />

                <Flex align="center" gap={12} wrap="wrap">
                    {!isEditMode && (
                        <Button
                            onClick={() => setSaveModalOpen(true)}
                            icon={
                                <ReactSVG
                                    src={TemplateIcon}
                                    beforeInjection={svg => {
                                        svg.setAttribute('style', 'width:16px;height:16px;');
                                        svg.setAttribute('stroke', '#FF3A3A');
                                    }}
                                />
                            }
                            className="h-10 !border-[#FF3A3A] !text-[#FF3A3A] rounded-lg font-normal font-['Roboto'] text-base flex items-center"
                        >
                            Save Template
                        </Button>
                    )}
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
            </Flex>

            {/* Editor / Preview */}
            {/* Editor always mounted to preserve edits */}
            <div style={{ display: headerMode === 'edit' ? 'block' : 'none' }}>
                <DocumentEditor ref={editorRef} initialHtml={initialHtml} />
            </div>

            {/* Preview — rendered from current editor HTML */}
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

            {/* Save as Template modal (only for new docs) */}
            {!isEditMode && (
                <CustomModalWithForm
                    open={saveModalOpen}
                    handleCancel={() => setSaveModalOpen(false)}
                    modalTitle="Save as Template"
                    initialValues={{ title: '' }}
                    handleFormSubmit={handleSaveAsTemplate}
                    firstBtnTxt="Save"
                    secondBtnTxt="Cancel"
                    isLoading={isSavingTemplate}
                    resetFormWhenClose
                >
                    {formikBag => (
                        <Flex vertical gap={16} className="pt-2">
                            <TypographyText className="text-sm font-medium font-['Roboto'] text-gray-700">
                                Template Name <span className="text-red-500">*</span>
                            </TypographyText>
                            <Input
                                name="title"
                                value={formikBag.values.title}
                                onChange={e => {
                                    formikBag.handleChange(e);
                                    formikBag.setFieldError('title', '');
                                }}
                                onClear={() => {
                                    formikBag.setFieldValue('title', '');
                                    formikBag.setFieldError('title', '');
                                }}
                                allowClear
                                placeholder="Enter template name"
                                className={`h-10 rounded-lg w-full text-sm font-['Roboto'] ${formikBag.errors.title ? '!border-red-400' : ''}`}
                            />
                            {formikBag.errors.title && (
                                <TypographyText className="text-xs text-red-500 font-['Roboto'] -mt-3">
                                    {formikBag.errors.title as string}
                                </TypographyText>
                            )}
                        </Flex>
                    )}
                </CustomModalWithForm>
            )}
        </Flex>
    );
};

export default DocumentPage;
