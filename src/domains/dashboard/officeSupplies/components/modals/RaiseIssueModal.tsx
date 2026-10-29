import { useState, type FC, useEffect } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Select, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { IssuePhoto } from '../../utils/issuePhoto';
import { ISSUE_TAXONOMY } from '../../utils/issueTaxonomy';
import IssuePhotoPicker from "../IssuePhotoPicker";

const { Text } = Typography;
const { TextArea } = Input;

interface RaiseIssueModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (
        category: string,
        subCategory: string,
        description: string,
        images: IssuePhoto[]
    ) => Promise<boolean>;
}

const RaiseIssueModal: FC<RaiseIssueModalProps> = ({ open, onClose, onSubmit }) => {
    const dispatch = useAppDispatch();
    const [category, setCategory] = useState<string>();
    const [subCategory, setSubCategory] = useState<string>();
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<IssuePhoto[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeCategory = ISSUE_TAXONOMY.find(c => c.value === category);
    const subCategoryOptions = activeCategory ? activeCategory.subCategories : [];

    useEffect(() => {
        setSubCategory(undefined);
    }, [category]);

    const reset = () => {
        setCategory(undefined);
        setSubCategory(undefined);
        setDescription('');
        setPhotos([]);
    };

    const close = () => {
        if (isSubmitting) return;
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        if (!category || !subCategory || !description.trim()) {
            dispatch(
                showToast({ description: 'Please fill in all required fields.', variant: 'error' })
            );
            return;
        }
        setIsSubmitting(true);
        const succeeded = await onSubmit(category, subCategory, description, photos);
        setIsSubmitting(false);
        if (succeeded) {
            reset();
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onCancel={close}
            footer={null}
            closable={false}
            centered
            width={580}
            styles={{ content: { borderRadius: 16 } }}
            classNames={{ content: '!p-4 sm:!p-6' }}
        >
            <Flex vertical gap={20}>
                {/* Header */}
                <Flex align="start" justify="space-between">
                    <Flex vertical gap={4} className="pe-6">
                        <Text className="text-[20px] font-semibold text-[#101828]">
                            Raise an issue
                        </Text>
                        <Text className="text-[14px] text-[#667085]">
                            Your issue goes to the seller on the ONDC network; Peko tracks it until
                            {" it's "}resolved.
                        </Text>
                    </Flex>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Close"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] hover:bg-[#e9e9e9] transition-colors"
                    >
                        <CloseOutlined className="text-[#667085]" />
                    </button>
                </Flex>

                {/* Category Select */}
                <Flex vertical gap={6}>
                    <Text className="text-[14px] font-medium text-[#344054]">
                        Category <span className="text-red-500">*</span>
                    </Text>
                    <Select
                        size="large"
                        placeholder="Select a reason"
                        value={category}
                        onChange={setCategory}
                        className="w-full"
                        options={ISSUE_TAXONOMY.map(c => ({ label: c.label, value: c.value }))}
                    />
                </Flex>

                {/* Sub-category Select */}
                <Flex vertical gap={6}>
                    <Text className="text-[14px] font-medium text-[#344054]">
                        Sub-category <span className="text-red-500">*</span>
                    </Text>
                    <Select
                        size="large"
                        placeholder={category ? "Select a reason" : "Select a category first"}
                        value={subCategory}
                        onChange={setSubCategory}
                        disabled={!category}
                        className="w-full"
                        options={subCategoryOptions}
                    />
                </Flex>

                {/* Description Textarea */}
                <Flex vertical gap={6}>
                    <Text className="text-[14px] font-medium text-[#344054]">
                        Description <span className="text-red-500">*</span>
                    </Text>
                    <TextArea
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Tell the seller what went wrong"
                        className="!rounded-lg"
                    />
                </Flex>

                {/* Photos (optional) */}
                <IssuePhotoPicker value={photos} onChange={setPhotos} disabled={isSubmitting} />

                {/* Actions */}
                <Flex justify="end" gap={12} className="mt-2">
                    <Button
                        onClick={close}
                        disabled={isSubmitting}
                        className="!h-10 !rounded-lg !px-5 !font-medium !text-[#344054] !border-[#D0D5DD]"
                    >
                        Keep order
                    </Button>
                    <Button
                        type="primary"
                        disabled={!category || !subCategory || !description.trim() || isSubmitting}
                        loading={isSubmitting}
                        onClick={handleSubmit}
                        className="!h-10 !rounded-lg !px-5 !font-medium !bg-[#E01A1A] hover:!bg-[#C21616] border-none"
                    >
                        Raise issue
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default RaiseIssueModal;
