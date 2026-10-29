import { useState, type FC } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Select, Typography, InputNumber, Segmented } from 'antd';

import IssuePhotoPicker from './IssuePhotoPicker';
import { OndcOrderDetailItem } from '../types/ondcOrderHistory';
import { IssuePhoto } from '../utils/issuePhoto';
import { formatInr } from '../utils/priceInr';

const { Text } = Typography;
const { TextArea } = Input;

export type ReturnReasonOption = { id: string; label: string };
export type ReturnIntent = 'return' | 'replace';

interface ReturnOrderModalProps {
    open: boolean;
    onClose: () => void;
    orderId: string;
    items: OndcOrderDetailItem[];
    reasons: ReturnReasonOption[];
    refundAmount: number;
    onSubmit: (payload: {
        items: { itemId: string; quantity: number }[];
        reasonId: string;
        reasonDesc: string;
        images: IssuePhoto[];
        replace: boolean;
    }) => Promise<boolean>;
}

const DEFAULT_REASONS: ReturnReasonOption[] = [
    { id: '001', label: 'Item defective / not working' },
    { id: '002', label: 'Wrong item delivered' },
    { id: '003', label: 'Product quality not as expected' },
    { id: '004', label: 'Damaged packaging / damaged product' },
    { id: '005', label: 'Missing parts / accessories' },
    { id: '007', label: 'Ordered by mistake' },
    { id: '008', label: 'Other' },
];

const ReturnOrderModal: FC<ReturnOrderModalProps> = ({
    open,
    onClose,
    orderId,
    items,
    reasons,
    refundAmount,
    onSubmit,
}) => {
    const reasonOptions = reasons?.length ? reasons : DEFAULT_REASONS;
    const returnableItems = items.filter(i => i.returnable !== false && i.itemId);

    const [reasonId, setReasonId] = useState<string>();
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<IssuePhoto[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [intent, setIntent] = useState<ReturnIntent>('return');
    const isReplace = intent === 'replace';

    const reset = () => {
        setReasonId(undefined);
        setDescription('');
        setPhotos([]);
        setQuantities({});
        setIntent('return');
    };

    const close = () => {
        if (isSubmitting) return;
        reset();
        onClose();
    };

    const qtyFor = (item: OndcOrderDetailItem) => {
        const id = String(item.itemId);
        if (quantities[id] != null) return quantities[id];
        return item.quantity || 1;
    };

    const handleSubmit = async () => {
        if (!reasonId || !returnableItems.length) return;
        const selected = returnableItems
            .map(item => ({
                itemId: String(item.itemId),
                quantity: qtyFor(item),
            }))
            .filter(i => i.quantity > 0);
        if (!selected.length) return;

        setIsSubmitting(true);
        const succeeded = await onSubmit({
            items: selected,
            reasonId,
            reasonDesc: description,
            images: photos,
            replace: isReplace,
        });
        setIsSubmitting(false);
        if (succeeded) reset();
    };

    return (
        <Modal
            open={open}
            onCancel={close}
            footer={null}
            closable={false}
            centered
            width={560}
            styles={{ content: { borderRadius: 24 } }}
            classNames={{ content: '!p-4 sm:!p-7' }}
        >
            <Flex vertical gap={20}>
                <Flex align="start" justify="space-between">
                    <Flex vertical gap={4} className="pe-4">
                        <Text className="text-[22px] font-semibold text-black">
                            {isReplace ? 'Replace order' : 'Return order'}
                        </Text>
                        <Text className="text-[14px] text-[#6a7282]">
                            {isReplace
                                ? `Order ${orderId}. The seller will send a replacement — there is no refund.`
                                : `Order ${orderId}. Eligible refund up to ${formatInr(refundAmount)}.`}
                        </Text>
                    </Flex>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={close}
                        className="mt-1 flex h-8 w-8 items-center justify-center rounded-full text-[#667085] hover:bg-gray-100"
                    >
                        <CloseOutlined />
                    </button>
                </Flex>

                <Segmented
                    block
                    value={intent}
                    onChange={val => setIntent(val as ReturnIntent)}
                    options={[
                        { label: 'Return', value: 'return' },
                        { label: 'Replace', value: 'replace' },
                    ]}
                    className="w-full !rounded-full !bg-[#fafafa] !px-1 !py-1
                        [&_.ant-segmented-item]:rounded-full
                        [&_.ant-segmented-item-selected]:!bg-white"
                />

                {returnableItems.map(item => (
                    <Flex key={String(item.itemId)} align="center" justify="space-between" gap={12}>
                        <Text className="text-[14px] text-[#1e293b] flex-1">
                            {item.productName}
                        </Text>
                        <InputNumber
                            min={1}
                            max={item.quantity || 1}
                            value={qtyFor(item)}
                            onChange={v =>
                                setQuantities(prev => ({
                                    ...prev,
                                    [String(item.itemId)]: Number(v) || 1,
                                }))
                            }
                        />
                    </Flex>
                ))}

                <Flex vertical gap={8}>
                    <Text className="text-[14px] font-medium text-[#344054]">Reason</Text>
                    <Select
                        placeholder="Select a reason"
                        value={reasonId}
                        onChange={setReasonId}
                        options={reasonOptions.map(r => ({ value: r.id, label: r.label }))}
                        className="w-full"
                        size="large"
                    />
                </Flex>

                <Flex vertical gap={8}>
                    <Text className="text-[14px] font-medium text-[#344054]">
                        Description (optional)
                    </Text>
                    <TextArea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Add more detail for the seller"
                        maxLength={500}
                    />
                </Flex>

                <IssuePhotoPicker value={photos} onChange={setPhotos} />

                <Flex justify="end" gap={12}>
                    <Button onClick={close} disabled={isSubmitting} className="!h-10 !rounded-xl">
                        Keep order
                    </Button>
                    <Button
                        type="primary"
                        danger={!isReplace}
                        disabled={!reasonId || isSubmitting}
                        loading={isSubmitting}
                        onClick={handleSubmit}
                        className="!h-10 !rounded-xl"
                    >
                        {isReplace ? 'Submit replacement' : 'Submit return'}
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default ReturnOrderModal;
