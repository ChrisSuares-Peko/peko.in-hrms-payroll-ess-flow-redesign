import { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Empty, Flex, Spin, Tag, Tooltip, Typography } from 'antd';
import { useBeforeUnload, useNavigate, useParams } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import { HtmlEditorHandle } from './HtmlCodeMirrorEditor';
import MainWorkspace from './MainWorkspace';
import SidePanel from './SidePanel';
import TemplateDetailsForm from './TemplateDetailsForm';
import useGetEmailLayout from '../../../hooks/useGetEmailLayout';
import useGetEmailTemplate from '../../../hooks/useGetEmailTemplate';
import useUpdateEmailTemplate from '../../../hooks/useUpdateEmailTemplate';
import {
    EmailTemplate,
    EmailTemplateLayout,
    RolePermissionAccessData,
} from '../../../types/emailTemplate';
import EmailTemplateStatusPill from '../EmailTemplateStatusPill';

const emailTemplatesBasePath = `${paths.systemUser.settings}/${paths.settingsAdmin.EmailTemplates}`;

const getSaveActionTooltip = (canSubmit: boolean | undefined, isValid: boolean) => {
    if (!canSubmit) return 'Sorry, you do not have permission to perform this action';
    if (!isValid) return 'Please fill in Template Name, Key, Service and Subject';
    return '';
};

type TemplateDetailsSnapshot = {
    name: string;
    key: string;
    service: string;
    partnerId: string | number | null;
    subject: string;
    sender: string;
    html: string;
    headerLayoutId: number | null;
    footerLayoutId: number | null;
};

const EmailTemplateEditorPage = () => {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const isCreateMode = templateId === 'new';
    const numericId = isCreateMode ? undefined : Number(templateId);

    const {
        template,
        setTemplate,
        isLoading: isLoadingTemplate,
        loadFailed,
    } = useGetEmailTemplate(numericId);
    const { createTemplate, saveDraft, publish, isSaving, isPublishing } = useUpdateEmailTemplate();

    const [name, setName] = useState('');
    const [templateKey, setTemplateKey] = useState('');
    const [service, setService] = useState('');
    const [partnerId, setPartnerId] = useState<string | number | null>(null);
    const [subject, setSubject] = useState('');
    const [sender, setSender] = useState('');
    const [html, setHtml] = useState('');
    const [sampleDataRaw, setSampleDataRaw] = useState('');
    // Persisted as `layout: { header, footer }`; selected layout HTML also feeds the preview as sample data.
    const [headerLayoutId, setHeaderLayoutId] = useState<number | null>(null);
    const [footerLayoutId, setFooterLayoutId] = useState<number | null>(null);
    const { layout: headerLayout } = useGetEmailLayout(headerLayoutId ?? undefined);
    const { layout: footerLayout } = useGetEmailLayout(footerLayoutId ?? undefined);
    const extraSampleData = useMemo(() => {
        const data: Record<string, string> = {};
        if (headerLayout)
            data.headerHtml = headerLayout.publishedHtml || headerLayout.draftHtml || '';
        if (footerLayout)
            data.footerHtml = footerLayout.publishedHtml || footerLayout.draftHtml || '';
        return data;
    }, [headerLayout, footerLayout]);
    const [snapshot, setSnapshot] = useState<TemplateDetailsSnapshot>({
        name: '',
        key: '',
        service: '',
        partnerId: null,
        subject: '',
        sender: '',
        html: '',
        headerLayoutId: null,
        footerLayoutId: null,
    });
    // Edit mode waits for the GET before rendering, so it never flashes empty fields.
    const [isHydrated, setIsHydrated] = useState(isCreateMode);

    const [mainTab, setMainTab] = useState<'html' | 'preview'>('html');
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const permissionService = useFindRolesService(services?.data, 'Email Templates');
    useEffect(() => {
        if (permissionService) setAccessPermission(permissionService);
    }, [permissionService]);

    // Create mode needs `write`; editing an existing draft needs `update` (same split Invoice Templates uses).
    const canSubmit = isCreateMode ? accessPermission?.write : accessPermission?.update;

    const htmlEditorRef = useRef<HtmlEditorHandle>(null);

    useEffect(() => {
        if (!template) return;
        setName(template.name);
        setTemplateKey(template.key);
        setService(template.service);
        setPartnerId(template.partnerId);
        setSubject(template.subject);
        setSender(template.sender || '');
        setHtml(template.draftHtmlBody);
        setHeaderLayoutId(template.layout?.header ?? null);
        setFooterLayoutId(template.layout?.footer ?? null);
        setSnapshot({
            name: template.name,
            key: template.key,
            service: template.service,
            partnerId: template.partnerId,
            subject: template.subject,
            sender: template.sender || '',
            html: template.draftHtmlBody,
            headerLayoutId: template.layout?.header ?? null,
            footerLayoutId: template.layout?.footer ?? null,
        });
        setIsHydrated(true);
    }, [template]);

    // Template-details dirty state deliberately excludes `sampleDataRaw` — sample
    // data is preview-only scratch state and must never mark the template dirty.
    const isDirty =
        name !== snapshot.name ||
        templateKey !== snapshot.key ||
        service !== snapshot.service ||
        partnerId !== snapshot.partnerId ||
        subject !== snapshot.subject ||
        sender !== snapshot.sender ||
        html !== snapshot.html ||
        headerLayoutId !== snapshot.headerLayoutId ||
        footerLayoutId !== snapshot.footerLayoutId;

    useBeforeUnload(
        event => {
            if (isDirty) event.preventDefault();
        },
        { capture: true }
    );

    const isValid = Boolean(name.trim() && templateKey.trim() && service.trim() && subject.trim());

    const layout: EmailTemplateLayout = { header: headerLayoutId, footer: footerLayoutId };

    // The Template Key options are scoped to the selected Service, so a service
    // change in create mode invalidates whatever key was picked for the old one.
    const handleServiceChange = (value: string) => {
        setService(value);
        if (isCreateMode) setTemplateKey('');
    };

    // Save Draft and Publish both need a persisted template id. In create mode,
    // the first save/publish creates it; subsequent saves reuse the same id.
    const ensureTemplateCreated = async (): Promise<EmailTemplate | false> => {
        if (template?.id) return template;
        const created = await createTemplate({
            key: templateKey,
            name,
            service,
            partnerId,
            subject,
            sender: sender || undefined,
            draftHtmlBody: html,
            layout,
            isActive: true,
        });
        if (created) {
            setTemplate(created);
            navigate(`${emailTemplatesBasePath}/${created.id}`, { replace: true });
        }
        return created;
    };

    const handleSaveDraft = async () => {
        let updated: EmailTemplate | false;
        if (!template?.id) {
            updated = await ensureTemplateCreated();
        } else {
            updated = await saveDraft(template.id, {
                name,
                service,
                partnerId,
                subject,
                sender: sender || undefined,
                draftHtmlBody: html,
                layout,
            });
        }
        if (updated) {
            setTemplate(updated);
            setSnapshot({
                name,
                key: templateKey,
                service,
                partnerId,
                subject,
                sender,
                html,
                headerLayoutId,
                footerLayoutId,
            });
            dispatch(showToast({ description: 'Draft saved', variant: 'success' }));
        }
    };

    const handlePublish = async () => {
        const persisted = await ensureTemplateCreated();
        if (!persisted) {
            setPublishConfirmOpen(false);
            return;
        }
        // Must check layout ids too, not just html/subject — a header/footer-only change still needs saving before publish.
        const draftSaved =
            persisted.draftHtmlBody === html &&
            persisted.subject === subject &&
            (persisted.layout?.header ?? null) === headerLayoutId &&
            (persisted.layout?.footer ?? null) === footerLayoutId
                ? persisted
                : await saveDraft(persisted.id, {
                      name,
                      service,
                      partnerId,
                      subject,
                      sender: sender || undefined,
                      draftHtmlBody: html,
                      layout,
                  });
        if (!draftSaved) {
            setPublishConfirmOpen(false);
            return;
        }
        const published = await publish(persisted.id);
        setPublishConfirmOpen(false);
        if (published) {
            setTemplate(published);
            setSnapshot({
                name,
                key: templateKey,
                service,
                partnerId,
                subject,
                sender,
                html,
                headerLayoutId,
                footerLayoutId,
            });
            dispatch(
                showToast({
                    description: 'Email template published successfully.',
                    variant: 'success',
                })
            );
        }
    };

    const handleCancel = () => {
        if (isDirty) {
            setCancelConfirmOpen(true);
            return;
        }
        navigate(emailTemplatesBasePath);
    };

    if (!isCreateMode && loadFailed) {
        return (
            <Flex vertical align="center" justify="center" gap={16} className="w-full py-16">
                <Empty description="This email template could not be loaded." />
                <Button type="primary" danger onClick={() => navigate(emailTemplatesBasePath)}>
                    Back to Email Templates
                </Button>
            </Flex>
        );
    }

    if (!isCreateMode && (isLoadingTemplate || !isHydrated)) {
        return (
            <Flex align="center" justify="center" className="w-full py-16">
                <Spin size="large" />
            </Flex>
        );
    }

    return (
        <Flex
            vertical
            gap={16}
            className="min-h-0"
            style={{ height: 'calc(100vh - 260px)', minHeight: 560 }}
        >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                    <Typography.Text className="text-lg font-medium sm:text-xl">
                        {isCreateMode ? 'Create Email Template' : 'Edit Email Template'}
                    </Typography.Text>
                    {template && (
                        <Flex align="center" gap={8}>
                            <EmailTemplateStatusPill status={template.status} />
                            <Tag>v{template.version}</Tag>
                            <Tag color={template.isActive ? 'green' : 'default'}>
                                {template.isActive ? 'Active' : 'Inactive'}
                            </Tag>
                        </Flex>
                    )}
                </Flex>
            </Flex>

            <TemplateDetailsForm
                name={name}
                onNameChange={setName}
                templateKey={templateKey}
                onKeyChange={setTemplateKey}
                isKeyEditable={isCreateMode}
                service={service}
                onServiceChange={handleServiceChange}
                partnerId={partnerId}
                onPartnerIdChange={setPartnerId}
                subject={subject}
                onSubjectChange={setSubject}
                sender={sender}
                onSenderChange={setSender}
            />

            <Flex gap={20} className="flex-col lg:flex-row flex-1 min-h-[420px]">
                <div className="w-full lg:w-2/3 min-h-[420px]">
                    <MainWorkspace
                        html={html}
                        onHtmlChange={setHtml}
                        sampleDataRaw={sampleDataRaw}
                        htmlEditorRef={htmlEditorRef}
                        activeTab={mainTab}
                        onActiveTabChange={setMainTab}
                        extraSampleData={extraSampleData}
                    />
                </div>
                <div className="w-full lg:w-1/3 min-h-[420px]">
                    <SidePanel
                        service={service}
                        templateKey={templateKey}
                        sampleDataRaw={sampleDataRaw}
                        onSampleDataChange={setSampleDataRaw}
                        onInsertIntoHtml={text => htmlEditorRef.current?.insertText(text)}
                        headerLayoutId={headerLayoutId}
                        onHeaderLayoutChange={setHeaderLayoutId}
                        footerLayoutId={footerLayoutId}
                        onFooterLayoutChange={setFooterLayoutId}
                    />
                </div>
            </Flex>

            <Flex justify="flex-end" align="center" wrap="wrap" gap={12}>
                <Button onClick={handleCancel}>Cancel</Button>
                <Flex gap={12}>
                    <Tooltip title={getSaveActionTooltip(canSubmit, isValid)}>
                        <Button
                            onClick={handleSaveDraft}
                            disabled={!isValid || !canSubmit}
                            loading={isSaving}
                        >
                            Save Draft
                        </Button>
                    </Tooltip>
                    <Tooltip title={getSaveActionTooltip(canSubmit, isValid)}>
                        <Button
                            type="primary"
                            danger
                            disabled={!isValid || !canSubmit}
                            loading={isPublishing}
                            onClick={() => setPublishConfirmOpen(true)}
                        >
                            Publish
                        </Button>
                    </Tooltip>
                </Flex>
            </Flex>

            {publishConfirmOpen && (
                <ConfirmationModal
                    isOpen
                    title="Publish Template?"
                    description="This will publish the current version of this email template."
                    handleCancel={() => setPublishConfirmOpen(false)}
                    handleSubmit={handlePublish}
                    isLoading={isSaving || isPublishing}
                />
            )}
            {cancelConfirmOpen && (
                <ConfirmationModal
                    isOpen
                    title="Discard unsaved changes?"
                    description="You have unsaved changes to this email template. Leaving now will discard them."
                    handleCancel={() => setCancelConfirmOpen(false)}
                    handleSubmit={() => navigate(emailTemplatesBasePath)}
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default EmailTemplateEditorPage;
