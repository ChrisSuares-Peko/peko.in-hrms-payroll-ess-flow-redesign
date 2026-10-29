import { type FC } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Modal, Typography } from 'antd';

import { UnavailableCartItem } from '../../utils/unavailableCartItems';

const { Text } = Typography;

interface UnavailableItemsModalProps {
    open: boolean;
    items: UnavailableCartItem[];
    confirming?: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<boolean | void>;
}

/**
 * Lists seller products that cannot be ordered and asks the buyer to confirm
 * removing them from cart (checkout uses the same cart). Follows CancelOrderModal
 * conventions (closable={false} + custom header close, centered).
 */
const UnavailableItemsModal: FC<UnavailableItemsModalProps> = ({
    open,
    items,
    confirming = false,
    onClose,
    onConfirm,
}) => {
    const close = () => {
        if (confirming) return;
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={close}
            footer={null}
            closable={false}
            maskClosable={!confirming}
            centered
            width={560}
            styles={{ content: { borderRadius: 24 } }}
            classNames={{ content: '!p-4 sm:!p-7' }}
        >
            <Flex vertical gap={20}>
                <Flex align="start" justify="space-between">
                    <Flex vertical gap={4} className="pe-4">
                        <Text className="text-[22px] font-semibold text-black">
                            Some items cannot be ordered
                        </Text>
                        <Text className="text-[14px] text-[#6a7282]">
                            These products need to be removed from your cart and checkout. Confirm
                            to remove them, or keep them and stay on this page.
                        </Text>
                    </Flex>
                    <button
                        type="button"
                        onClick={close}
                        disabled={confirming}
                        aria-label="Close"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] disabled:opacity-40"
                    >
                        <CloseOutlined className="text-[#6a7282]" />
                    </button>
                </Flex>

                <Flex
                    vertical
                    gap={12}
                    className="max-h-72 overflow-y-auto rounded-xl border border-solid border-[#e4e4e7] p-3"
                >
                    {items.map((item, idx) => (
                        <Flex
                            key={`${item.productId ?? item.ondcProductId ?? item.productName}-${idx}`}
                            gap={12}
                            align="start"
                            className="border-b border-solid border-[#f4f4f5] pb-3 last:border-b-0 last:pb-0"
                        >
                            <Image
                                src={item.image || undefined}
                                alt=""
                                width={56}
                                height={56}
                                preview={false}
                                className="!h-14 !w-14 shrink-0 rounded-lg object-cover"
                            />
                            <Flex vertical gap={2} className="min-w-0">
                                <Text className="text-[15px] font-semibold text-[#101828]">
                                    {item.productName}
                                </Text>
                                <Text className="text-[13px] text-[#6a7282]">{item.vendorName}</Text>
                            </Flex>
                        </Flex>
                    ))}
                </Flex>

                <Flex gap={12}>
                    <Button
                        onClick={close}
                        disabled={confirming}
                        className="!h-11 !flex-1 !rounded-lg !font-medium"
                    >
                        Keep items
                    </Button>
                    <Button
                        type="primary"
                        danger
                        loading={confirming}
                        onClick={() => onConfirm()}
                        className="!h-11 !flex-1 !rounded-lg !font-medium"
                    >
                        Remove items
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default UnavailableItemsModal;
