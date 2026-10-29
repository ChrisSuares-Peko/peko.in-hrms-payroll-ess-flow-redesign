import { useEffect, useMemo, useState } from 'react';

import { Alert, Button, Drawer, Flex, Radio, Select, Typography } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { CLASSIFICATION_RULES } from './ServiceClassificationHeader';
import { ClassificationOption, ServiceClassificationTab } from '../../types/serviceClassification';
import {
    confirmLiveOptionsText,
    liveForLabel,
    liveOptionsTitle,
    needsApproval,
} from '../../utils/serviceClassification';

export const CLASSIFY_DRAWER_TITLE = 'Classify service';
export const DRAWER_OPTIONS_HINT = 'Only active services that are not classified yet are listed.';

type Props = {
    open: boolean;
    options: ClassificationOption[];
    loadingOptions: boolean;
    initialAccessKey?: string | null;
    isSaving: boolean;
    onCancel: () => void;
    onSubmit: (
        services: ClassificationOption[],
        planType: ServiceClassificationTab
    ) => Promise<boolean>;
};

const optionCaption = (option: ClassificationOption) =>
    [
        option.accessKey,
        option.vendor?.vendorName,
        option.liveFor.length ? liveForLabel(option.liveFor) : null,
    ]
        .filter(Boolean)
        .join(' · ');

const ClassifyServiceDrawer = ({
    open,
    options,
    loadingOptions,
    initialAccessKey = null,
    isSaving,
    onCancel,
    onSubmit,
}: Props) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [planType, setPlanType] = useState<ServiceClassificationTab | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!open) return;
        setSelectedKeys(
            initialAccessKey && options.some(option => option.accessKey === initialAccessKey)
                ? [initialAccessKey]
                : []
        );
        setPlanType(null);
        setConfirming(false);
    }, [open, initialAccessKey, options]);

    const selected = useMemo(
        () => options.filter(option => selectedKeys.includes(option.accessKey)),
        [options, selectedKeys]
    );
    const live =
        planType === null || needsApproval(planType)
            ? selected.filter(option => option.liveFor.length > 0)
            : [];
    const ready = selected.length > 0 && planType !== null;

    const save = async () => {
        if (!planType) return;
        setConfirming(false);
        const done = await onSubmit(selected, planType);
        if (done) {
            setSelectedKeys([]);
            setPlanType(null);
        }
    };

    const submit = () => {
        if (live.length) setConfirming(true);
        else save();
    };

    return (
        <Drawer
            open={open}
            onClose={onCancel}
            title={CLASSIFY_DRAWER_TITLE}
            width={520}
            destroyOnClose
            footer={
                <Flex justify="end" gap={8}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button type="primary" disabled={!ready} loading={isSaving} onClick={submit}>
                        Classify
                    </Button>
                </Flex>
            }
        >
            <Flex vertical gap={20}>
                <Flex vertical gap={6}>
                    <Typography.Text strong className="text-textHeadings">
                        Services
                    </Typography.Text>
                    <Select
                        mode="multiple"
                        placeholder="Pick one or more active services"
                        value={selectedKeys}
                        onChange={setSelectedKeys}
                        loading={loadingOptions}
                        options={options.map(option => ({
                            value: option.accessKey,
                            label: option.serviceProvider,
                            caption: optionCaption(option),
                        }))}
                        filterOption={(input, option) =>
                            `${option?.label ?? ''} ${option?.caption ?? ''}`
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                        optionRender={option => (
                            <Flex vertical>
                                <span>{option.data.label}</span>
                                <span className="text-xs text-navTextColor">
                                    {option.data.caption}
                                </span>
                            </Flex>
                        )}
                        aria-label="Services to classify"
                        className="w-full"
                    />
                    <Typography.Text className="text-xs text-navTextColor">
                        {DRAWER_OPTIONS_HINT}
                    </Typography.Text>
                </Flex>
                <Flex vertical gap={6}>
                    <Typography.Text strong className="text-textHeadings">
                        Classification
                    </Typography.Text>
                    <Radio.Group
                        value={planType}
                        onChange={event => setPlanType(event.target.value)}
                        aria-label="Classification"
                    >
                        <Flex vertical gap={10}>
                            {CLASSIFICATION_RULES.map(rule => (
                                <Radio key={rule.key} value={rule.key}>
                                    <Flex vertical>
                                        <Typography.Text strong className="text-textHeadings">
                                            {rule.title}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-textBody">
                                            {rule.text}
                                        </Typography.Text>
                                    </Flex>
                                </Radio>
                            ))}
                        </Flex>
                    </Radio.Group>
                </Flex>
                {live.length > 0 && (
                    <Alert
                        type="warning"
                        showIcon
                        message={liveOptionsTitle(live)}
                        description="Classifying them approves them for those partners straight away, so nothing goes offline."
                        className="rounded-lg"
                    />
                )}
            </Flex>
            <ConfirmationModal
                isOpen={confirming}
                handleCancel={() => setConfirming(false)}
                title={confirmLiveOptionsText(live)}
                handleSubmit={save}
                isLoading={isSaving}
            />
        </Drawer>
    );
};

export default ClassifyServiceDrawer;
