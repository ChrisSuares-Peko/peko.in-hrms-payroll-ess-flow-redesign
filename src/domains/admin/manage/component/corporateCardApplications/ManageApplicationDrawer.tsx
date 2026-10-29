import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import {
    Button,
    Drawer,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Skeleton,
    Tag,
    Typography,
} from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';
import { formatCompleteDate } from '@utils/dateFormat';

import { KYB_STATUS_META, KYB_STATUS_OPTIONS } from './statusMeta';
import {
    getCorporateCardApplication,
    getCorporatesForApplication,
    retryVendorKybEmail,
    updateCorporateCardApplication,
} from '../../api/corporateCardApplications';
import {
    CorporateCardApplicationRow,
    CorporateOption,
    KybStatus,
    UpdateApplicationPayload,
    VendorEmailDelivery,
} from '../../types/corporateCardApplications';

interface Props {
    open: boolean;
    mode: 'create' | 'edit';
    row: CorporateCardApplicationRow | null; // edit only
    onClose: () => void;
    onSaved: () => void;
}

// Shared free-text checks: no leading/trailing/consecutive spaces, no bare single character.
// allowedPattern additionally restricts which characters the value may contain.
const freeTextRule = (allowedPattern: RegExp, allowedDescription: string, multiline = false) => ({
    validator(_: unknown, value?: string) {
        if (!value) return Promise.resolve();
        if (value !== value.trim()) {
            return Promise.reject(new Error('Remove the leading or trailing spaces.'));
        }
        const lines = multiline ? value.split('\n') : [value];
        if (lines.some(line => line !== line.trim())) {
            return Promise.reject(new Error('Remove the leading or trailing spaces.'));
        }
        if (lines.some(line => /\s{2,}/.test(line))) {
            return Promise.reject(new Error('Remove the consecutive spaces.'));
        }
        if (lines.some(line => !line)) {
            return Promise.reject(new Error('Remove the blank lines.'));
        }
        if (value.trim().length < 2) {
            return Promise.reject(new Error('Enter at least 2 characters.'));
        }
        if (!allowedPattern.test(value)) {
            return Promise.reject(new Error(`Only ${allowedDescription} are allowed.`));
        }
        return Promise.resolve();
    },
});

const NAME_PATTERN = /^[A-Za-z][A-Za-z .'&-]*$/;
const NAME_ALLOWED_DESCRIPTION = "letters, spaces, and ' - & .";
const ADDRESS_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ,./#:&\n-]*$/;
const ADDRESS_ALLOWED_DESCRIPTION = 'letters, numbers, spaces, line breaks, and , . / # : & -';
const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._/-]*$/;
const REFERENCE_ALLOWED_DESCRIPTION = 'letters, numbers, spaces, and . _ / -';
const KYB_REFERENCE_PATTERN = /^KYB[0-9A-F]{10}$/;
const CARD_SCHEME_ID_MAX_DIGITS = 9;
const REJECTION_REASON_MIN = 10;
const REJECTION_REASON_MAX = 500;

const rejectionReasonRule = {
    validator(_: unknown, value?: string) {
        const text = value?.trim() ?? '';
        if (!text) return Promise.resolve();
        if (text.length < REJECTION_REASON_MIN) {
            return Promise.reject(
                new Error(`Rejection reason must be at least ${REJECTION_REASON_MIN} characters`)
            );
        }
        if (text.length > REJECTION_REASON_MAX) {
            return Promise.reject(
                new Error(`Rejection reason cannot exceed ${REJECTION_REASON_MAX} characters`)
            );
        }
        return Promise.resolve();
    },
};

const vendorEmailMetaFor = (vendorEmail: VendorEmailDelivery | null) => {
    if (vendorEmail?.status === true) {
        return {
            color: 'green',
            label: 'Sent',
            action: 'Send again',
            detail: vendorEmail.sentAt
                ? `Delivered to the vendor's mail server on ${formatCompleteDate(vendorEmail.sentAt)}.`
                : "Delivered to the vendor's mail server.",
        };
    }
    if (vendorEmail?.status === false) {
        return {
            color: 'red',
            label: 'Not sent',
            action: 'Retry',
            detail: 'The last attempt did not go out. Retry to send it again.',
        };
    }
    return {
        color: 'default',
        label: 'Not attempted',
        action: 'Retry',
        detail: 'No email has gone to the vendor for this application yet.',
    };
};

/** Bordered sub-card grouping one logical set of fields, with a title + helper header. */
const SectionCard = ({
    title,
    helper,
    children,
}: {
    title: string;
    helper?: string;
    children: ReactNode;
}) => (
    <div className="rounded-xl border border-borderCard p-4">
        <Flex vertical gap={2} className="mb-3">
            <Typography.Text strong className="text-base text-textHeadings">
                {title}
            </Typography.Text>
            {helper && (
                <Typography.Text className="text-xs text-textGreyLight">{helper}</Typography.Text>
            )}
        </Flex>
        {children}
    </div>
);

const ManageApplicationDrawer = ({ open, mode, row, onClose, onSaved }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const screens = useScreenSize();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [vendorEmail, setVendorEmail] = useState<VendorEmailDelivery | null>(null);
    const [vendorConfirm, setVendorConfirm] = useState<any>(null);
    const [completedConfirm, setCompletedConfirm] = useState<any>(null);
    const [completedConfirmText, setCompletedConfirmText] = useState('');
    const [svcLast4, setSvcLast4] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<KybStatus | null>(null);
    // Backend auto-generates kybReference the first time the corporate submits their KYB
    // (see corporateCard controllers/corporate/kybStatus.js submitKyb) — once set, it must not
    // be hand-edited. Only empty (not yet generated, e.g. a brand-new application) is editable.
    const [hasKybReference, setHasKybReference] = useState(false);

    // create mode — corporate picker
    const [corporates, setCorporates] = useState<CorporateOption[]>([]);
    const [corpLoading, setCorpLoading] = useState(false);

    // Live readiness check — mirrors the backend's completion gate so "Completed" can't be picked
    // (and then rejected) before the required fields actually exist.
    const watchedCardSchemeId = Form.useWatch('cardSchemeId', form);
    const watchedSvcCardNumber = Form.useWatch('svcCardNumber', form);
    const watchedAccountNumber = Form.useWatch('accountNumber', form);
    const watchedIfsc = Form.useWatch('ifsc', form);
    const watchedKybStatus = Form.useWatch('kybStatus', form);

    const missing: string[] = [];
    if (!watchedCardSchemeId) missing.push('card scheme ID');
    if (!svcLast4 && !watchedSvcCardNumber?.trim()) missing.push('SVC card number');
    if (!watchedAccountNumber?.trim()) missing.push('virtual account number');
    if (!watchedIfsc?.trim()) missing.push('IFSC code');

    const readOnlyStatuses: KybStatus[] = ['COMPLETED', 'PENDING'];
    const statusOptions = KYB_STATUS_OPTIONS.filter(
        opt =>
            !readOnlyStatuses.includes(opt.value) ||
            currentStatus === opt.value ||
            watchedKybStatus === opt.value
    ).map(opt => {
        if (readOnlyStatuses.includes(opt.value)) return { ...opt, disabled: true };
        return opt.value === 'VERIFIED' ? { ...opt, disabled: missing.length > 0 } : opt;
    });

    const vendorEmailMeta = vendorEmailMetaFor(vendorEmail);

    const loadCorporates = useCallback(
        async (searchText?: string) => {
            setCorpLoading(true);
            const res = await getCorporatesForApplication(role, id, searchText);
            if (res) setCorporates(res);
            setCorpLoading(false);
        },
        [role, id]
    );

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleCorporateSearch = (value: string) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => loadCorporates(value.trim() || undefined), 300);
    };

    useEffect(() => {
        if (!open) return undefined;
        let active = true;
        form.resetFields();
        setSvcLast4(null);
        setCurrentStatus(null);
        setHasKybReference(false);
        setVendorEmail(null);

        if (mode === 'create') {
            setCorporates([]);
            loadCorporates();
            form.setFieldsValue({ kybStatus: 'PENDING' });
            return undefined;
        }

        if (!row) return undefined;
        (async () => {
            setLoading(true);
            const detail = await getCorporateCardApplication(role, id, row.corporateId);
            if (active && detail) {
                setSvcLast4(detail.svcCardNumberLast4);
                setCurrentStatus(detail.kybStatus);
                setHasKybReference(Boolean(detail.kybReference));
                setVendorEmail(detail.vendorEmail ?? null);
                form.setFieldsValue({
                    cardSchemeId: detail.cardSchemeId ?? undefined,
                    svcCardNumber: '',
                    beneficiaryName: detail.virtualAccount.beneficiaryName ?? '',
                    accountNumber: detail.virtualAccount.accountNumber ?? '',
                    ifsc: detail.virtualAccount.ifsc ?? '',
                    bankName: detail.virtualAccount.bankName ?? '',
                    bankAddress: detail.virtualAccount.bankAddress ?? '',
                    paymentReference: detail.virtualAccount.paymentReference ?? '',
                    kybReference: detail.kybReference ?? '',
                    rejectionReason: detail.rejectionReason ?? '',
                    kybStatus: detail.kybStatus,
                });
            }
            if (active) setLoading(false);
        })();
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, row?.corporateId]);

    const submit = async (values: any) => {
        const targetCorporateId = mode === 'create' ? values.corporateId : row?.corporateId;

        const payload: UpdateApplicationPayload = {
            cardSchemeId: values.cardSchemeId ?? null,
            kybReference: values.kybReference?.trim() || '',
            rejectionReason: values.rejectionReason?.trim() || '',
            virtualAccount: {
                beneficiaryName: values.beneficiaryName?.trim() || '',
                accountNumber: values.accountNumber?.trim().toUpperCase() || '',
                ifsc: values.ifsc?.trim().toUpperCase() || '',
                bankName: values.bankName?.trim() || '',
                bankAddress: values.bankAddress?.trim() || '',
                paymentReference: values.paymentReference?.trim() || '',
            },
        };
        if (values.kybStatus && values.kybStatus !== 'COMPLETED')
            payload.kybStatus = values.kybStatus;
        // Only send the SVC card number when a new one was entered — blank keeps the stored value.
        if (values.svcCardNumber?.trim()) payload.svcCardNumber = values.svcCardNumber.trim();

        setSaving(true);
        const res = await updateCorporateCardApplication(role, id, targetCorporateId, payload);
        setSaving(false);
        if (res) {
            setVendorEmail(res.application?.vendorEmail ?? null);
            if (res.vendorEmailError) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: `Saved, but the vendor email did not go out: ${res.vendorEmailError}`,
                    })
                );
            } else {
                dispatch(
                    showToast({
                        variant: 'success',
                        description:
                            mode === 'create' ? 'Application created.' : 'Application updated.',
                    })
                );
            }
            onSaved();
        }
    };

    const handleRetryVendorEmail = async () => {
        if (!row?.corporateId) return;
        setRetrying(true);
        const res = await retryVendorKybEmail(role, id, row.corporateId);
        setRetrying(false);
        if (!res) return;
        setVendorEmail(res.application?.vendorEmail ?? null);
        dispatch(
            showToast({
                variant: res.vendorEmailError ? 'error' : 'success',
                description: res.vendorEmailError
                    ? `Still could not reach the vendor: ${res.vendorEmailError}`
                    : 'Vendor review email sent.',
            })
        );
        onSaved();
    };

    const continueSave = async (values: any) => {
        if (values.kybStatus === 'UNDER_REVIEW' && currentStatus !== 'UNDER_REVIEW') {
            setVendorConfirm(values);
            return;
        }

        await submit(values);
    };

    const handleSave = async () => {
        let values: any;
        try {
            values = await form.validateFields();
        } catch {
            return;
        }

        if (currentStatus === 'COMPLETED' && values.kybStatus !== 'COMPLETED') {
            setCompletedConfirmText('');
            setCompletedConfirm(values);
            return;
        }

        await continueSave(values);
    };

    // Edit header shows a company-name hero with a status tag; create is a plain title.
    const drawerPrimaryName = row?.companyName || row?.fullName || 'Unnamed corporate';
    const drawerShowFullNameLine = Boolean(row?.companyName) && Boolean(row?.fullName);
    const drawerTitle =
        mode === 'create' ? (
            'Add Application'
        ) : (
            <Flex vertical gap={4}>
                <Typography.Title level={4} className="!mb-0">
                    {drawerPrimaryName}
                </Typography.Title>
                {(drawerShowFullNameLine || row?.pekoAccountNumber) && (
                    <Typography.Text className="text-xs text-textGreyLight">
                        {[drawerShowFullNameLine ? row?.fullName : null, row?.pekoAccountNumber]
                            .filter(Boolean)
                            .join('  ·  ')}
                    </Typography.Text>
                )}
                {currentStatus && (
                    <Tag
                        className="w-fit rounded-full border-0 px-3 py-0.5 text-xs font-medium"
                        style={{
                            color: (KYB_STATUS_META[currentStatus] ?? KYB_STATUS_META.PENDING)
                                .color,
                            backgroundColor: (
                                KYB_STATUS_META[currentStatus] ?? KYB_STATUS_META.PENDING
                            ).bg,
                        }}
                    >
                        {(KYB_STATUS_META[currentStatus] ?? KYB_STATUS_META.PENDING).label}
                    </Tag>
                )}
            </Flex>
        );

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={screens.md ? 560 : '100%'}
            title={drawerTitle}
            closeIcon={null}
            extra={
                <CloseOutlined
                    onClick={onClose}
                    className="cursor-pointer text-base text-textHeadings"
                />
            }
            destroyOnClose
            styles={{ body: { paddingInline: 20, paddingBlock: 16 } }}
            footer={
                <Flex justify="end" gap={12}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="primary" loading={saving} onClick={handleSave}>
                        Save
                    </Button>
                </Flex>
            }
        >
            {loading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Flex vertical gap={20}>
                        {mode === 'create' && (
                            <SectionCard
                                title="Corporate"
                                helper="Only corporates without an existing application appear here."
                            >
                                <Form.Item
                                    name="corporateId"
                                    rules={[
                                        { required: true, message: 'Please select a corporate.' },
                                    ]}
                                    className="!mb-0"
                                >
                                    <Select
                                        showSearch
                                        filterOption={false}
                                        placeholder="Search corporate by name, username or email"
                                        notFoundContent={
                                            corpLoading ? (
                                                <Skeleton.Button active block />
                                            ) : (
                                                'No corporates found'
                                            )
                                        }
                                        onSearch={handleCorporateSearch}
                                        options={corporates.map(c => ({
                                            label:
                                                [c.name || c.companyName, c.username, c.email]
                                                    .filter(Boolean)
                                                    .join('  ·  ') || `Corporate #${c.corporateId}`,
                                            value: c.corporateId,
                                        }))}
                                    />
                                </Form.Item>
                            </SectionCard>
                        )}

                        <SectionCard
                            title="Card Provisioning"
                            helper="Pine Labs card scheme and the 16-digit SVC card."
                        >
                            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                                <Form.Item
                                    name="cardSchemeId"
                                    label="Card Scheme ID"
                                    dependencies={['kybStatus']}
                                    rules={[
                                        {
                                            validator(_, value) {
                                                if (value === undefined || value === null) {
                                                    return Promise.resolve();
                                                }
                                                if (
                                                    String(value).length < 4 ||
                                                    String(value).length >
                                                        CARD_SCHEME_ID_MAX_DIGITS
                                                ) {
                                                    return Promise.reject(
                                                        new Error(
                                                            `Card scheme ID must be 4 to ${CARD_SCHEME_ID_MAX_DIGITS} digits.`
                                                        )
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const status = getFieldValue('kybStatus');
                                                if (
                                                    (status === 'VERIFIED' ||
                                                        status === 'COMPLETED') &&
                                                    !value
                                                ) {
                                                    return Promise.reject(
                                                        new Error(
                                                            'Card scheme ID is required to mark this application Verified or Completed.'
                                                        )
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                    className="!mb-6 sm:!mb-0"
                                >
                                    <InputNumber<number>
                                        min={1}
                                        precision={0}
                                        parser={(value: string | undefined) => {
                                            const digits =
                                                value
                                                    ?.replace(/\D/g, '')
                                                    .slice(0, CARD_SCHEME_ID_MAX_DIGITS) ?? '';
                                            return digits === '' ? NaN : Number(digits);
                                        }}
                                        className="w-full"
                                        placeholder="e.g. 12345"
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="svcCardNumber"
                                    label={
                                        svcLast4
                                            ? `SVC Card Number (current •••• ${svcLast4})`
                                            : 'SVC Card Number'
                                    }
                                    dependencies={['kybStatus']}
                                    rules={[
                                        {
                                            pattern: /^\d{16}$/,
                                            message: 'Must be exactly 16 digits.',
                                        },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const status = getFieldValue('kybStatus');
                                                const hasValue = svcLast4 || value?.trim();
                                                if (
                                                    (status === 'VERIFIED' ||
                                                        status === 'COMPLETED') &&
                                                    !hasValue
                                                ) {
                                                    return Promise.reject(
                                                        new Error(
                                                            'SVC card number is required to mark this application Verified or Completed.'
                                                        )
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                    normalize={(value: string) => value?.replace(/\D/g, '')}
                                    className="!mb-0"
                                >
                                    <Input
                                        placeholder={
                                            svcLast4
                                                ? 'Enter to replace (16 digits)'
                                                : '16-digit SVC card number'
                                        }
                                        maxLength={16}
                                        inputMode="numeric"
                                    />
                                </Form.Item>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Virtual Bank Account"
                            helper="The funding account the corporate transfers money into."
                        >
                            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                                <Form.Item
                                    name="beneficiaryName"
                                    label="Beneficiary Name"
                                    rules={[freeTextRule(NAME_PATTERN, NAME_ALLOWED_DESCRIPTION)]}
                                >
                                    <Input placeholder="Account holder name" maxLength={120} />
                                </Form.Item>
                                <Form.Item
                                    name="accountNumber"
                                    label="Account Number"
                                    dependencies={['kybStatus']}
                                    rules={[
                                        {
                                            pattern: /^[A-Za-z0-9]{9,18}$/,
                                            message:
                                                'Enter a valid account number (9–18 letters or digits).',
                                        },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const status = getFieldValue('kybStatus');
                                                if (
                                                    (status === 'VERIFIED' ||
                                                        status === 'COMPLETED') &&
                                                    !value?.trim()
                                                ) {
                                                    return Promise.reject(
                                                        new Error(
                                                            'Account number is required to mark this application Verified or Completed.'
                                                        )
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                    normalize={(value: string) => value?.toUpperCase()}
                                >
                                    <Input placeholder="Account number" maxLength={18} />
                                </Form.Item>
                                <Form.Item
                                    name="ifsc"
                                    label="IFSC Code"
                                    dependencies={['kybStatus']}
                                    rules={[
                                        {
                                            pattern: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
                                            message: 'Enter a valid IFSC.',
                                        },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const status = getFieldValue('kybStatus');
                                                if (
                                                    (status === 'VERIFIED' ||
                                                        status === 'COMPLETED') &&
                                                    !value?.trim()
                                                ) {
                                                    return Promise.reject(
                                                        new Error(
                                                            'IFSC code is required to mark this application Verified or Completed.'
                                                        )
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                    normalize={(value: string) => value?.toUpperCase()}
                                >
                                    <Input placeholder="e.g. HDFC0001234" maxLength={11} />
                                </Form.Item>
                                <Form.Item
                                    name="bankName"
                                    label="Bank Name"
                                    rules={[freeTextRule(NAME_PATTERN, NAME_ALLOWED_DESCRIPTION)]}
                                >
                                    <Input placeholder="Bank name" maxLength={120} />
                                </Form.Item>
                                <Form.Item
                                    name="bankAddress"
                                    label="Bank Address"
                                    className="sm:col-span-2"
                                    rules={[
                                        freeTextRule(
                                            ADDRESS_PATTERN,
                                            ADDRESS_ALLOWED_DESCRIPTION,
                                            true
                                        ),
                                    ]}
                                >
                                    <Input.TextArea
                                        placeholder="Bank branch address"
                                        maxLength={255}
                                        autoSize={{ minRows: 2, maxRows: 3 }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="paymentReference"
                                    label="Payment Reference"
                                    className="!mb-0 sm:col-span-2"
                                    rules={[
                                        freeTextRule(
                                            REFERENCE_PATTERN,
                                            REFERENCE_ALLOWED_DESCRIPTION
                                        ),
                                    ]}
                                >
                                    <Input
                                        placeholder="Payment reference / remark"
                                        maxLength={140}
                                    />
                                </Form.Item>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="KYB Status"
                            helper="Manually tracked; Verified and Completed require all fields above."
                        >
                            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                                <Form.Item
                                    name="kybReference"
                                    label="KYB Reference"
                                    rules={[
                                        {
                                            validator(_, value?: string) {
                                                if (hasKybReference || !value?.trim()) {
                                                    return Promise.resolve();
                                                }
                                                if (!KYB_REFERENCE_PATTERN.test(value.trim())) {
                                                    return Promise.reject(
                                                        new Error(
                                                            'A KYB reference looks like KYB4A9F2C1B0E and is generated when the corporate submits their KYB.'
                                                        )
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="Auto-generated once the corporate submits KYB"
                                        maxLength={13}
                                        disabled={hasKybReference}
                                    />
                                </Form.Item>
                                <Form.Item name="kybStatus" label="Status">
                                    <Select options={statusOptions} />
                                </Form.Item>
                                {watchedKybStatus === 'REJECTED' && (
                                    <Form.Item
                                        name="rejectionReason"
                                        label="Rejection Reason"
                                        className="sm:col-span-2"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'Tell the corporate why the KYB was rejected.',
                                            },
                                            rejectionReasonRule,
                                        ]}
                                    >
                                        <Input.TextArea
                                            placeholder="Shown to the corporate on the KYB rejected screen"
                                            maxLength={REJECTION_REASON_MAX}
                                            showCount
                                            autoSize={{ minRows: 2, maxRows: 4 }}
                                        />
                                    </Form.Item>
                                )}
                            </div>
                        </SectionCard>

                        {mode === 'edit' && currentStatus === 'UNDER_REVIEW' && (
                            <SectionCard
                                title="Vendor Review Email"
                                helper="The KYB pack sent to the Corporate Cards vendor when this application moved to Under review."
                            >
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    gap={12}
                                    wrap="wrap"
                                    data-testid="vendor-email-state"
                                >
                                    <Flex vertical gap={4}>
                                        <Tag
                                            className="w-fit rounded-full border-0 px-3 py-0.5 text-xs font-medium"
                                            color={vendorEmailMeta.color}
                                        >
                                            {vendorEmailMeta.label}
                                        </Tag>
                                        <Typography.Text className="text-xs text-textGreyLight">
                                            {vendorEmailMeta.detail}
                                        </Typography.Text>
                                    </Flex>
                                    <Button
                                        loading={retrying}
                                        onClick={handleRetryVendorEmail}
                                        danger={vendorEmail?.status === false}
                                    >
                                        {vendorEmailMeta.action}
                                    </Button>
                                </Flex>
                            </SectionCard>
                        )}
                    </Flex>
                </Form>
            )}

            <Modal
                open={vendorConfirm !== null}
                onCancel={() => setVendorConfirm(null)}
                onOk={async () => {
                    await submit(vendorConfirm);
                    setVendorConfirm(null);
                }}
                okText="Send to vendor"
                cancelText="Cancel"
                okButtonProps={{ loading: saving }}
                title="Send this application to the vendor?"
                destroyOnHidden
            >
                <Typography.Text>
                    Moving this application to Under review emails the vendor contact configured for
                    Corporate Cards, asking them to run their KYB checks. The corporate is not
                    emailed.
                </Typography.Text>
            </Modal>

            <Modal
                open={completedConfirm !== null}
                onCancel={() => setCompletedConfirm(null)}
                onOk={async () => {
                    const values = completedConfirm;
                    setCompletedConfirm(null);
                    await continueSave(values);
                }}
                okText="Change status"
                cancelText="Cancel"
                okType="danger"
                okButtonProps={{
                    loading: saving,
                    disabled:
                        completedConfirmText.trim().toUpperCase() !== completedConfirm?.kybStatus,
                }}
                title="Take this application back from Completed?"
                destroyOnHidden
            >
                <Flex vertical gap={12}>
                    <Typography.Text>
                        {`${row?.companyName || 'This corporate'} has already completed onboarding. Moving them to ${
                            (
                                KYB_STATUS_META[completedConfirm?.kybStatus as KybStatus] ??
                                KYB_STATUS_META.PENDING
                            ).label
                        } locks them out of their Corporate Cards dashboard — wallet, cardholders, card issuance and transactions. Cards already issued keep working.`}
                    </Typography.Text>
                    <Typography.Text strong>
                        You cannot undo this from here. Only the corporate can return to Completed,
                        by signing in and acknowledging the verified screen again.
                    </Typography.Text>
                    <Flex vertical gap={6}>
                        <Typography.Text className="text-xs text-textGreyLight">
                            {`Type ${completedConfirm?.kybStatus} to confirm.`}
                        </Typography.Text>
                        <Input
                            value={completedConfirmText}
                            onChange={e => setCompletedConfirmText(e.target.value)}
                            placeholder={completedConfirm?.kybStatus}
                            aria-label="Type the status to confirm"
                        />
                    </Flex>
                </Flex>
            </Modal>
        </Drawer>
    );
};

export default ManageApplicationDrawer;
