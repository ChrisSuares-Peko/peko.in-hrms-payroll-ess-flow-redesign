import { useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Flex, Select, Tag, Tooltip, Typography } from 'antd';

import { TransactionCategory, transactionCategoryOptions } from '../../utils/transactionsData';

const { Text } = Typography;

const CATEGORY_OPTIONS = transactionCategoryOptions.map(option => ({
    label: option.label,
    value: option.label,
}));

const UNCATEGORIZED = 'Uncategorized';

interface CategoryTagProps {
    category: TransactionCategory;

    onAccept?: () => void;

    onSelect?: (category: string) => void;
}

const CategoryTag = ({ category, onAccept, onSelect }: CategoryTagProps) => {
    const [editing, setEditing] = useState(false);

    const handleSelect = (value: string) => {
        setEditing(false);
        onSelect?.(value);
    };

    if (editing) {
        const current =
            category.label && category.label !== UNCATEGORIZED ? category.label : undefined;

        const options =
            current && !CATEGORY_OPTIONS.some(option => option.value === current)
                ? [{ label: current, value: current }, ...CATEGORY_OPTIONS]
                : CATEGORY_OPTIONS;
        return (
            <Select
                autoFocus
                defaultOpen
                showSearch
                value={current}
                placeholder="Select category"
                options={options}
                optionFilterProp="label"
                onChange={handleSelect}
                onBlur={() => setEditing(false)}
                size="middle"
                className="w-full"
            />
        );
    }

    const editable = Boolean(onSelect);

    return (
        <Flex vertical gap={8} className="min-w-0">
            <Flex align="center" gap={8} wrap="wrap" className="min-w-0">
                <Tooltip title={editable ? 'Change category' : undefined}>
                    <Tag
                        onClick={editable ? () => setEditing(true) : undefined}
                        role={editable ? 'button' : undefined}
                        tabIndex={editable ? 0 : undefined}
                        aria-label={
                            editable ? `Change category, currently ${category.label}` : undefined
                        }
                        onKeyDown={
                            editable
                                ? event => {
                                      if (event.key === 'Enter' || event.key === ' ') {
                                          event.preventDefault();
                                          setEditing(true);
                                      }
                                  }
                                : undefined
                        }
                        className={`!m-0 max-w-full truncate !rounded-lg !border-borderSubtle !bg-white !px-3 !py-1.5 !text-sm !font-medium !text-bodyText ${
                            editable ? 'cursor-pointer hover:!border-borderStrong' : ''
                        }`}
                    >
                        {category.label}
                    </Tag>
                </Tooltip>
                {typeof category.confidence === 'number' && (
                    <Text className="shrink-0 text-xs font-medium text-muted">
                        {category.confidence}%
                    </Text>
                )}
            </Flex>

            {category.suggested && (
                <Flex align="center" gap={16}>
                    <Button
                        type="link"
                        onClick={onAccept}
                        icon={<CheckCircleFilled />}
                        className="!h-auto !p-0 !text-sm !font-medium !text-success hover:!opacity-80"
                    >
                        Accept
                    </Button>
                    <Button
                        type="link"
                        onClick={() => setEditing(true)}
                        className="!h-auto !p-0 !text-sm !font-medium !text-muted hover:!text-bodyText"
                    >
                        Change
                    </Button>
                </Flex>
            )}
        </Flex>
    );
};

export default CategoryTag;
