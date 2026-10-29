import { useEffect, useRef, useState } from 'react';

import { Button, Empty, Flex, Spin, Tag, Tooltip, Typography } from 'antd';
import { useBeforeUnload, useNavigate, useParams } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import LayoutDetailsForm from './LayoutDetailsForm';
import LayoutSidePanel from './LayoutSidePanel';
import useGetEmailLayout from '../../../hooks/useGetEmailLayout';
import useUpdateEmailLayout from '../../../hooks/useUpdateEmailLayout';
import { EmailLayout, EmailLayoutType } from '../../../types/emailLayout';
import { RolePermissionAccessData } from '../../../types/emailTemplate';
import { HtmlEditorHandle } from '../../emailTemplateManagement/editor/HtmlCodeMirrorEditor';
import MainWorkspace from '../../emailTemplateManagement/editor/MainWorkspace';
import EmailLayoutStatusPill from '../EmailLayoutStatusPill';

const emailLayoutsBasePath = `${paths.systemUser.settings}/${paths.settingsAdmin.EmailLayouts}`;

const getSaveActionTooltip = (canSubmit: boolean | undefined, isValid: boolean) => {
    if (!canSubmit) return 'Sorry, you do not have permission to perform this action';
    if (!isValid) return 'Please fill in Layout Name and Type';
    return '';
};

type LayoutDetailsSnapshot = {
    name: string;
    type: EmailLayoutType | '';
    partnerId: string | number | null;
    html: string;
};

const EmailLayoutEditorPage = () => {
    const { layoutId } = useParams<{ layoutId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const isCreateMode = layoutId === 'new';
    const numericId = isCreateMode ? undefined : Number(layoutId);

    const {
        layout,
        setLayout,
        isLoading: isLoadingLayout,
        loadFailed,
    } = useGetEmailLayout(numericId);
    const { createLayout, saveDraft, publish, isSaving, isPublishing } = useUpdateEmailLayout();

    const [name, setName] = useState('');
    const [type, setType] = useState<EmailLayoutType | ''>('');
    const [partnerId, setPartnerId] = useState<string | number | null>(null);
    const [html, setHtml] = useState('');
    // Preview-only scratch state, excluded from isDirty on purpose.
    const [sampleDataRaw, setSampleDataRaw] = useState('');
    const [snapshot, setSnapshot] = useState<LayoutDetailsSnapshot>({
        name: '',
        type: '',
        partnerId: null,
        html: '',
    });
    const [isHydrated, setIsHydrated] = useState(isCreateMode);

    const [mainTab, setMainTab] = useState<'html' | 'preview'>('html');
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();

    // Reuses the same "Email Templates" permission the Templates editor gates
    // on — Layouts has no permission entry of its own.
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const permissionService = useFindRolesService(services?.data, 'Email Templates');
    useEffect(() => {
        if (permissionService) setAccessPermission(permissionService);
    }, [permissionService]);

    // Create mode needs `write`; editing an existing draft needs `update` —
    // same split emailTemplateManagement's editor uses.
    const canSubmit = isCreateMode ? accessPermission?.write : accessPermission?.update;

    const htmlEditorRef = useRef<HtmlEditorHandle>(null);

    useEffect(() => {
        if (!layout) return;
        // draftHtml can be null; normalize to '' here so setHtml and snapshot agree, or isDirty falsely reads true on load.
        const draftHtml = layout.draftHtml || '';
        setName(layout.name);
        setType(layout.type);
        setPartnerId(layout.partnerId);
        setHtml(draftHtml);
        setSnapshot({
            name: layout.name,
            type: layout.type,
            partnerId: layout.partnerId,
            html: draftHtml,
        });
        setIsHydrated(true);
    }, [layout]);

    const isDirty =
        name !== snapshot.name ||
        type !== snapshot.type ||
        partnerId !== snapshot.partnerId ||
        html !== snapshot.html;

    useBeforeUnload(
        event => {
            if (isDirty) event.preventDefault();
        },
        { capture: true }
    );

    const isValid = Boolean(name.trim() && type);

    // Save Draft and Publish both need a persisted layout id. In create mode,
    // the first save/publish creates it; subsequent saves reuse the same id.
    const ensureLayoutCreated = async (): Promise<EmailLayout | false> => {
        if (layout?.id) return layout;
        if (!type) return false;
        const created = await createLayout({
            name,
            type,
            partnerId,
            draftHtml: html,
            isActive: true,
        });
        if (created) {
            setLayout(created);
            navigate(`${emailLayoutsBasePath}/${created.id}`, { replace: true });
        }
        return created;
    };

    const handleSaveDraft = async () => {
        let updated: EmailLayout | false;
        if (!layout?.id) {
            updated = await ensureLayoutCreated();
        } else {
            updated = await saveDraft(layout.id, { name, type, partnerId, draftHtml: html });
        }
        if (updated) {
            setLayout(updated);
            setSnapshot({ name, type, partnerId, html });
            dispatch(showToast({ description: 'Draft saved', variant: 'success' }));
        }
    };

    const handlePublish = async () => {
        const persisted = await ensureLayoutCreated();
        if (!persisted) {
            setPublishConfirmOpen(false);
            return;
        }
        // Always save the draft first so Publish promotes the latest edits —
        // see emailTemplateManagement's editor for why this can't be skipped.
        const draftSaved = await saveDraft(persisted.id, {
            name,
            type,
            partnerId,
            draftHtml: html,
        });
        if (!draftSaved) {
            setPublishConfirmOpen(false);
            return;
        }
        const published = await publish(persisted.id);
        setPublishConfirmOpen(false);
        if (published) {
            setLayout(published);
            setSnapshot({ name, type, partnerId, html });
            dispatch(
                showToast({
                    description: 'Email layout published successfully.',
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
        navigate(emailLayoutsBasePath);
    };

    if (!isCreateMode && loadFailed) {
        return (
            <Flex vertical align="center" justify="center" gap={16} className="w-full py-16">
                <Empty description="This email layout could not be loaded." />
                <Button type="primary" danger onClick={() => navigate(emailLayoutsBasePath)}>
                    Back to Email Layouts
                </Button>
            </Flex>
        );
    }

    if (!isCreateMode && (isLoadingLayout || !isHydrated)) {
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
            className="min-h-0 overflow-y-auto"
            style={{ height: 'calc(100vh - 260px)', minHeight: 560 }}
        >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                    <Typography.Text className="text-lg font-medium sm:text-xl">
                        {isCreateMode ? 'Create Email Layout' : 'Edit Email Layout'}
                    </Typography.Text>
                    {layout && (
                        <Flex align="center" gap={8}>
                            <EmailLayoutStatusPill status={layout.status} />
                            <Tag>v{layout.version}</Tag>
                            <Tag color={layout.isActive ? 'green' : 'default'}>
                                {layout.isActive ? 'Active' : 'Inactive'}
                            </Tag>
                        </Flex>
                    )}
                </Flex>
            </Flex>

            <LayoutDetailsForm
                name={name}
                onNameChange={setName}
                type={type}
                onTypeChange={setType}
                partnerId={partnerId}
                onPartnerIdChange={setPartnerId}
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
                    />
                </div>
                <div className="w-full lg:w-1/3 min-h-[420px]">
                    <LayoutSidePanel
                        html={html}
                        sampleDataRaw={sampleDataRaw}
                        onSampleDataChange={setSampleDataRaw}
                        onInsertVariable={token => {
                            setMainTab('html');
                            htmlEditorRef.current?.insertText(token);
                        }}
                    />
                </div>
            </Flex>

            <Flex justify="end" align="center" wrap="wrap" gap={12}>
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
                    title="Publish Layout?"
                    description="This will publish the current version of this email layout."
                    handleCancel={() => setPublishConfirmOpen(false)}
                    handleSubmit={handlePublish}
                    isLoading={isSaving || isPublishing}
                />
            )}
            {cancelConfirmOpen && (
                <ConfirmationModal
                    isOpen
                    title="Discard unsaved changes?"
                    description="You have unsaved changes to this email layout. Leaving now will discard them."
                    handleCancel={() => setCancelConfirmOpen(false)}
                    handleSubmit={() => navigate(emailLayoutsBasePath)}
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default EmailLayoutEditorPage;
