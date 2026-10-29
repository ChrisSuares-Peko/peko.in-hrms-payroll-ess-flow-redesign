import React, { useEffect, useState } from 'react';

import { Modal, Typography, Button, Checkbox, Flex, Skeleton } from 'antd';

import useUserPrivacyPoliciesApi from '../../hooks/useUserPrivacyPoliciesApi';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onAccept: (policyIds: Record<number, boolean>) => void;
    onClose: () => void;
    isLoading: boolean;
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const renderPolicyText = (
    text: string,
    hyperLinkText?: string,
    isMandatory?: number,
    effectiveFrom?: string
) => {
    const match = text.match(/^(.*?)\{(.+?)\}(.*)$/s);
    const textNode =
        !hyperLinkText || !match ? (
            <Typography.Text className="text-[.85rem]">{text}</Typography.Text>
        ) : (
            (() => {
                const [, before, linkLabel, after] = match;
                return (
                    <Typography.Text className="text-[.85rem]">
                        {before}
                        <Typography.Link
                            href={hyperLinkText}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: 'inherit',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {linkLabel}
                        </Typography.Link>
                        {after}
                    </Typography.Text>
                );
            })()
        );

    if (effectiveFrom!==null&& effectiveFrom !== undefined) {
        return (
            <Flex vertical gap={2}>
                {textNode}
                <Typography.Text className="text-[.75rem]" type="secondary">
                    Last Updated: {formatDate(effectiveFrom)}
                </Typography.Text>
            </Flex>
        );
    }

    return textNode;
};

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
    isOpen,
    onAccept,
    onClose,
    isLoading,
}) => {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
    const [submitted, setSubmitted] = useState(false);
    const { userPrivacyPolicies, isLoading: isPolicyLoading } = useUserPrivacyPoliciesApi();

    // nothing pending (e.g. reopened by a stale 006) — close instead of rendering an empty modal
    useEffect(() => {
        if (isOpen && !isPolicyLoading && userPrivacyPolicies.length === 0) {
            onClose();
        }
    }, [isOpen, isPolicyLoading, userPrivacyPolicies, onClose]);

    const getError = (item: (typeof userPrivacyPolicies)[number]) => {
        if (!submitted || !item.isMandatory || checkedItems[item.id]) return null;
        return item.validationText || 'You must accept this to proceed';
    };

    const handleAccept = async () => {
        setSubmitted(true);
        const allMandatoryChecked = userPrivacyPolicies
            .filter(item => item.isMandatory)
            .every(item => checkedItems[item.id]);
        if (!allMandatoryChecked) return;
        try {
            const policyIds = userPrivacyPolicies.reduce(
                (acc, item) => {
                    acc[item.id] = !!checkedItems[item.id];
                    return acc;
                },
                {} as Record<number, boolean>
            );
            onAccept(policyIds);
        } catch (err) {
            console.error('Failed to accept privacy policy', err);
        }
    };

    return (
        <Modal
            open={isOpen}
            centered
            closable={false}
            maskClosable={false}
            bodyStyle={{ paddingLeft: 20 }}
            footer={[
                <Button
                    key="accept"
                    type="primary"
                    loading={isLoading}
                    danger
                    onClick={handleAccept}
                >
                    {userPrivacyPolicies.every(item => !item.isMandatory) &&
                    !Object.values(checkedItems).some(Boolean)
                        ? 'Skip and Continue'
                        : 'Continue'}
                </Button>,
            ]}
        >
            <Flex vertical gap={10}>
                <Typography.Title level={5}>
                    Action Required: Reviews and consent to our policies
                </Typography.Title>

                {isPolicyLoading ? (
                    <>
                        <Skeleton.Input active block size="small" className="mt-2" />
                        <Skeleton.Input active block size="small" className="mt-2" />
                    </>
                ) : (
                    userPrivacyPolicies.map(item => (
                        <Flex key={item.id} vertical gap={2}>
                            <Checkbox
                                className="[&_.ant-checkbox]:self-start [&_.ant-checkbox]:mt-[3px]"
                                checked={!!checkedItems[item.id]}
                                onChange={e =>
                                    setCheckedItems(prev => ({
                                        ...prev,
                                        [item.id]: e.target.checked,
                                    }))
                                }
                            >
                                {renderPolicyText(
                                    item.privacyPolicyRegistrationText,
                                    item.hyperLinkText,
                                    item.isMandatory,
                                    item.effectiveFrom
                                )}
                            </Checkbox>
                            {getError(item) && (
                                <Typography.Text
                                    type="danger"
                                    className="text-[.75rem]"
                                    style={{ paddingLeft: 24 }}
                                >
                                    {getError(item)}
                                </Typography.Text>
                            )}
                        </Flex>
                    ))
                )}
            </Flex>
        </Modal>
    );
};

export default PrivacyPolicyModal;
