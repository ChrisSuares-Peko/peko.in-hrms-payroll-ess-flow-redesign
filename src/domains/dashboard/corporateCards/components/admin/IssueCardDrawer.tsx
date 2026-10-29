import { useState } from 'react';

import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Drawer, Form, Input, Select, Switch, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import { useCardUsersApi } from '../../hooks/admin/useCardUsersApi';
import { useIssueCardApi } from '../../hooks/admin/useIssueCardApi';
import { useMerchantCategoriesApi } from '../../hooks/admin/useMerchantCategoriesApi';
import { formatRupeesDecimal } from '../../utils/helpers';
import {
    ATM_PER_MONTH,
    ATM_PER_TXN,
    DEFAULT_FREQUENCY,
    FREQUENCY_OPTIONS,
    ISSUE_CARD_COPY as C,
} from '../../utils/issueCardData';
import { PineLabsFooter } from '../common/modalProps';

const { Text } = Typography;

interface IssueCardDrawerProps {
    open: boolean;
    onClose: () => void;
    /** Called after a card is issued, so the caller can refresh the cards list. */
    onSuccess?: () => void;
}

interface IssueCardForm {
    member: string;
    nameOnCard?: string;

    cardLimit: string;
    frequency: string;
    perTxnLimit?: string;
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const NAME_ON_CARD_MAX_LENGTH = 50;
const MAX_CARD_LIMIT_DIGITS = 10;

const wsRules = (label: string) => [
    {
        validator: (_: unknown, value: string) => {
            if (!value) return Promise.resolve();
            if (/^\s/.test(value))
                return Promise.reject(new Error(`${label} cannot start with a space`));
            if (/\s{2,}/.test(value))
                return Promise.reject(new Error(`${label} cannot contain consecutive spaces`));
            if (/^\s*$/.test(value))
                return Promise.reject(new Error(`${label} cannot be only spaces`));
            return Promise.resolve();
        },
    },
];

const positiveAmountRule = (label: string) => [
    {
        validator: (_: unknown, value: string) => {
            if (!value) return Promise.resolve();
            if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
                return Promise.reject(new Error(`${label} must be greater than 0`));
            }
            return Promise.resolve();
        },
    },
];

/** Right-side "Issue a card" drawer: spend caps, merchant restrictions and ATM toggle. */
const IssueCardDrawer = ({ open, onClose, onSuccess }: IssueCardDrawerProps) => {
    const dispatch = useAppDispatch();
    const screens = useScreenSize();
    const { members, isLoading: membersLoading } = useCardUsersApi(0, 'COMPLETED');
    const { submitIssueCard, isLoading: issuing } = useIssueCardApi();
    const { categories: merchantCategories } = useMerchantCategoriesApi();
    const [form] = Form.useForm<IssueCardForm>();

    const [restricted, setRestricted] = useState<string[]>([]);
    const [atmEnabled, setAtmEnabled] = useState(false);

    const memberOptions = members.map(m => ({ label: m.name, value: m.key, email: m.email }));

    const reset = () => {
        form.resetFields();
        setRestricted([]);
        setAtmEnabled(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const res = await submitIssueCard({
                userId: Number(values.member),
                cardLimit: Number(values.cardLimit),
                frequency: values.frequency,
                ...(values.perTxnLimit ? { perTxnLimit: Number(values.perTxnLimit) } : {}),
                ...(restricted.length ? { restrictedCategories: restricted } : {}),
                atmEnabled,
                ...(values.nameOnCard?.trim() ? { nameOnCard: values.nameOnCard.trim() } : {}),
            });
            if (res) {
                const confirmed = res.data?.confirmed !== false;
                const controlsApplied = res.data?.controlsApplied !== false;
                let description = 'Card issued successfully.';
                if (!confirmed) {
                    description =
                        'Card issuance is being processed. The card will show as Pending until the issuer confirms it.';
                } else if (!controlsApplied) {
                    description =
                        'Card issued, but the spend controls could not be applied. Set them from Manage card.';
                }
                dispatch(
                    showToast({
                        variant: confirmed && controlsApplied ? 'success' : 'warning',
                        description,
                    })
                );
                onSuccess?.();
                handleClose();
            }
            // eslint-disable-next-line no-empty
        } catch {}
    };

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            title={C.title}
            width={screens.md ? 600 : '100%'}
            closeIcon={null}
            extra={<CloseOutlined onClick={handleClose} className="text-base text-textHeadings" />}
            destroyOnHidden
            styles={{ body: { padding: 20 } }}
            footer={
                <div className="grid grid-cols-2 gap-3">
                    <Button danger onClick={handleClose} className="font-medium">
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        loading={issuing}
                        onClick={handleSubmit}
                        className="font-medium"
                    >
                        Issue card
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                <Text className="text-sm text-textBody">{C.subtitle}</Text>

                <div className="flex items-start gap-2 rounded-xl border border-savingsTagLightText/30 bg-savingsTagLightBg px-4 py-3">
                    <InfoCircleOutlined className="mt-0.5 text-savingsTagLightText" />
                    <Text className="text-sm text-textBody">
                        {C.banner.prefix}
                        <span className="font-semibold text-savingsTagLightText">
                            {C.banner.highlight}
                        </span>
                        {C.banner.suffix}
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    initialValues={{ frequency: DEFAULT_FREQUENCY }}
                >
                    <div className="flex flex-col gap-5">
                        <Form.Item
                            name="member"
                            label={
                                <span>
                                    Assign to member
                                    <span className="ml-0.5 text-errorTextRed">*</span>
                                </span>
                            }
                            rules={[{ required: true, message: 'Please select a member' }]}
                            className="!mb-0"
                        >
                            <Select
                                allowClear
                                showSearch
                                filterOption={(input, option) => {
                                    const q = input.toLowerCase();
                                    return (
                                        ((option?.label as string) ?? '')
                                            .toLowerCase()
                                            .includes(q) ||
                                        ((option?.email as string) ?? '').toLowerCase().includes(q)
                                    );
                                }}
                                loading={membersLoading}
                                placeholder="Select"
                                options={memberOptions}
                                optionRender={option => (
                                    <div className="flex flex-col py-0.5">
                                        <span className="text-sm text-textHeadings">
                                            {option.data.label}
                                        </span>
                                        <span className="text-xs text-textGreyLight">
                                            {option.data.email}
                                        </span>
                                    </div>
                                )}
                                notFoundContent={membersLoading ? 'Loading…' : 'No members found'}
                                className="w-full"
                            />
                        </Form.Item>

                        <Form.Item
                            name="nameOnCard"
                            label="Name on card"
                            rules={[
                                ...wsRules('Name on card'),
                                {
                                    max: NAME_ON_CARD_MAX_LENGTH,
                                    message: `Name on card must be ${NAME_ON_CARD_MAX_LENGTH} characters or fewer`,
                                },
                            ]}
                            extra={C.nameHelper}
                            className="!mb-0"
                        >
                            <Input
                                placeholder="Type"
                                maxLength={NAME_ON_CARD_MAX_LENGTH}
                                onChange={e =>
                                    form.setFieldValue(
                                        'nameOnCard',
                                        e.target.value.replace(/[^a-zA-Z\s]/g, '')
                                    )
                                }
                            />
                        </Form.Item>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Form.Item
                                name="cardLimit"
                                label={
                                    <span>
                                        Card limit (INR)
                                        <span className="ml-0.5 text-errorTextRed">*</span>
                                    </span>
                                }
                                rules={[
                                    { required: true, message: 'Please enter the card limit' },
                                    ...positiveAmountRule('Card limit'),
                                ]}
                                extra={C.cardLimitHelper}
                                className="!mb-0 sm:col-span-2"
                            >
                                <Input
                                    inputMode="numeric"
                                    placeholder="Type"
                                    maxLength={MAX_CARD_LIMIT_DIGITS}
                                    onChange={e =>
                                        form.setFieldValue('cardLimit', onlyDigits(e.target.value))
                                    }
                                />
                            </Form.Item>
                            <Form.Item
                                name="frequency"
                                label={
                                    <span>
                                        Frequency<span className="ml-0.5 text-errorTextRed">*</span>
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please select the frequency' }]}
                                className="!mb-0"
                            >
                                <Select
                                    placeholder="Select"
                                    options={FREQUENCY_OPTIONS}
                                    className="w-full"
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="perTxnLimit"
                            label="Per-transaction limit (INR, optional)"
                            rules={positiveAmountRule('Per-transaction limit')}
                            extra={C.perTxnHelper}
                            className="!mb-0"
                        >
                            <Input
                                inputMode="numeric"
                                placeholder="Type"
                                maxLength={MAX_CARD_LIMIT_DIGITS}
                                onChange={e =>
                                    form.setFieldValue('perTxnLimit', onlyDigits(e.target.value))
                                }
                            />
                        </Form.Item>
                    </div>
                </Form>

                <div className="flex flex-col gap-4 rounded-2xl border border-borderCard p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <Text className="text-base font-semibold text-textHeadings">
                                {C.merchantTitle}
                            </Text>
                            <Text className="text-sm text-textBody">{C.merchantSubtitle}</Text>
                        </div>
                        <span className="shrink-0 rounded-full bg-bgLightPink px-3 py-1 text-xs font-medium text-textLightRed">
                            Restrict
                        </span>
                    </div>
                    <Checkbox.Group
                        value={restricted}
                        onChange={values => setRestricted(values as string[])}
                        className="w-full"
                    >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {merchantCategories.map(({ category }) => (
                                <Checkbox key={category} value={category}>
                                    <span className="text-sm text-textBody">{category}</span>
                                </Checkbox>
                            ))}
                        </div>
                    </Checkbox.Group>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-borderCard p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <Text className="text-base font-semibold text-textHeadings">
                                {C.atmTitle}
                            </Text>
                            <Text className="text-sm text-textBody">
                                Allow cash withdrawals at ATMs. Standard limits apply:{' '}
                                {formatRupeesDecimal(ATM_PER_TXN)} per transaction,{' '}
                                {formatRupeesDecimal(ATM_PER_MONTH)} per month.
                            </Text>
                        </div>
                        <Switch checked={atmEnabled} onChange={setAtmEnabled} />
                    </div>
                    {atmEnabled && (
                        <div className="flex flex-col gap-1 border-t border-borderDivider pt-3">
                            <Text className="text-sm font-semibold text-textHeadings">
                                {C.atmFixedHeading}
                            </Text>
                            <ul className="list-disc pl-5 text-sm text-textBody">
                                <li>{formatRupeesDecimal(ATM_PER_TXN)} per transaction</li>
                                <li>{formatRupeesDecimal(ATM_PER_MONTH)} per calendar month</li>
                            </ul>
                        </div>
                    )}
                </div>
                <PineLabsFooter />
            </div>
        </Drawer>
    );
};

export default IssueCardDrawer;
