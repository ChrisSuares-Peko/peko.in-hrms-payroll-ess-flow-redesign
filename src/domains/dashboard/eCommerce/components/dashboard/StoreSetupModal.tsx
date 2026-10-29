import { useMemo, useState } from 'react';

import { Button, Flex, Form, Input, Modal, Typography } from 'antd';

import { PEKO_COMMERCE_STORE_DOMAIN } from '@src/config-global';

import modalIcon from '../../assets/icons/quick-actions/store-admin.svg';
import { useStoreSetup } from '../../hooks/useStoreSetup';
import { validateStoreName } from '../../schema';

type StoreSetupModalProps = {
    open: boolean;
    onSuccess: () => void;
};

const slugify = (raw: string) => raw.toLowerCase().replace(/[^a-z0-9]/g, '');

const StoreSetupModal = ({ open, onSuccess }: StoreSetupModalProps) => {
    const [storeName, setStoreName] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { setupStore, isLoading } = useStoreSetup();

    const slug = useMemo(() => slugify(storeName), [storeName]);
    const previewSlug = slug || 'yourstore';
    const previewUrl = `${previewSlug}.${PEKO_COMMERCE_STORE_DOMAIN}`;

    const handleSave = async () => {
        const validationError = validateStoreName(storeName);
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }
        setErrorMessage(null);
        const result = await setupStore({ storeName: storeName.trim() });
        if (result.ok) {
            onSuccess();
        } else {
            setErrorMessage(result.message);
        }
    };

    return (
        <Modal
            open={open}
            footer={null}
            closable={false}
            maskClosable={false}
            width={600}
            centered
            destroyOnClose
            className="ecommerce-store-setup-modal"
            styles={{ content: { borderRadius: '28px' } }}
        >
            <Flex vertical gap={24} className="p-2">
                <Flex align="center" gap={16}>
                    <div className="w-12 h-12 bg-[#F9F6F5] rounded-2xl flex items-center justify-center text-lightRed text-2xl shrink-0">
                        <img src={modalIcon} alt="Modal Icon" className="w-8 h-8" />
                    </div>
                    <Flex vertical gap={4}>
                        <Typography.Title level={4} className="!mb-0 !text-gray-900 !font-semibold">
                            Name Your Store
                        </Typography.Title>
                        <Typography.Text className="text-sm text-gray-500">
                            Choose a name for your store. Your store URL will be automatically
                            created.
                        </Typography.Text>
                    </Flex>
                </Flex>

                <Form layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        label={
                            <Typography.Text className="text-sm font-medium text-gray-700">
                                Store Name
                            </Typography.Text>
                        }
                        required={false}
                        validateStatus={errorMessage ? 'error' : ''}
                        help={errorMessage}
                    >
                        <Input
                            size="large"
                            placeholder="Anees store"
                            value={storeName}
                            onChange={e => {
                                const { value } = e.target;
                                setStoreName(value);
                                setErrorMessage(value ? validateStoreName(value) : null);
                            }}
                            maxLength={48}
                            autoFocus
                        />
                    </Form.Item>

                    <div className="bg-[#F8FAFC]  rounded-3xl p-4 mb-4">
                        <Typography.Text className="block text-sm text-gray-500 mb-2">
                            Your Store URL
                        </Typography.Text>
                        <Typography.Text className="block text-base font-medium text-lightRed font-mono">
                            {previewUrl}
                        </Typography.Text>
                        <Typography.Text className="block text-xs text-gray-400 mt-2">
                            Your store name and URL cannot be changed later.
                        </Typography.Text>
                    </div>

                    <Button
                        type="primary"
                        danger
                        htmlType="submit"
                        block
                        size="large"
                        loading={isLoading}
                        disabled={!storeName || !!errorMessage}
                        className="!h-12 !rounded-xl !font-semibold"
                    >
                        Save &amp; Continue
                    </Button>
                </Form>
            </Flex>
        </Modal>
    );
};

export default StoreSetupModal;
