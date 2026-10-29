import { useRef } from 'react';

import { DeleteOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Empty, Flex, Tooltip, Typography } from 'antd';
import { useDrag, useDrop } from 'react-dnd';

import DraggableCategory from './DraggableCategory';
import { ServiceNode, SERVICE_DND_TYPE } from '../../../types/systemUserTypes';

interface DragItem {
    index: number;
}

interface DraggableServiceCardProps {
    index: number;
    service: ServiceNode;
    moveService: (dragIndex: number, hoverIndex: number) => void;
    moveCategory: (parentId: string, dragIndex: number, hoverIndex: number) => void;
    moveLeaf: (categoryId: string, dragIndex: number, hoverIndex: number) => void;
    onRenameService: (label: string) => void;
    onAddCategory: () => void;
    onDeleteService: () => void;
    onRenameCategory: (categoryId: string, label: string) => void;
    onDeleteCategory: (categoryId: string, label: string) => void;
    onAddLeaf: (categoryId: string, categoryLabel: string) => void;
    onRenameLeaf: (categoryId: string, leafId: string, label: string) => void;
    onDeleteLeaf: (categoryId: string, leafId: string, label: string) => void;
}

// A service category card (L1): drag by the grip to reorder the whole card, rename
// inline, add a category, or delete. Categories (L2) render inside and each hold their
// own leaf services (L3). Only the grip starts a drag, so every control stays live.
const DraggableServiceCard = ({
    index,
    service,
    moveService,
    moveCategory,
    moveLeaf,
    onRenameService,
    onAddCategory,
    onDeleteService,
    onRenameCategory,
    onDeleteCategory,
    onAddLeaf,
    onRenameLeaf,
    onDeleteLeaf,
}: DraggableServiceCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);

    const [, drop] = useDrop<DragItem>({
        accept: SERVICE_DND_TYPE,
        hover(item, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;

            const hoverRect = ref.current.getBoundingClientRect();
            const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            const hoverClientY = clientOffset.y - hoverRect.top;

            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

            moveService(dragIndex, hoverIndex);
             
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: SERVICE_DND_TYPE,
        item: () => ({ index }),
        collect: monitor => ({ isDragging: monitor.isDragging() }),
    });

    preview(drop(ref));
    drag(handleRef);

    return (
        <div ref={ref}>
            <Card
                size="small"
                className={`mb-4 overflow-hidden rounded-xl border transition-all duration-150 ${
                    isDragging
                        ? 'border-brandColor opacity-40 shadow-xl'
                        : 'border-borderGray hover:-translate-y-0.5 hover:shadow-lg'
                }`}
                styles={{ body: { padding: 0 } }}
            >
                {/* Header */}
                <Flex
                    align="center"
                    gap={12}
                    className="bg-gradient-to-r from-red-50/70 to-transparent px-4 py-3"
                >
                    <span
                        ref={handleRef}
                        title="Drag to reorder"
                        className="flex cursor-grab text-lg text-textGrey transition-colors hover:text-brandColor active:cursor-grabbing"
                    >
                        <HolderOutlined />
                    </span>

                    <Flex vertical className="min-w-0 flex-1" gap={2}>
                        <Typography.Text
                            strong
                            className="text-base text-fontHead"
                            editable={{
                                onChange: value => value.trim() && onRenameService(value.trim()),
                                tooltip: 'Click to rename service category',
                                triggerType: ['text'],
                            }}
                            ellipsis
                        >
                            {service.label}
                        </Typography.Text>
                    </Flex>

                    <Tooltip title="Add category">
                        <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<PlusOutlined />}
                            onClick={onAddCategory}
                        >
                            Category
                        </Button>
                    </Tooltip>
                    <Tooltip title="Delete service category">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={onDeleteService}
                        />
                    </Tooltip>
                </Flex>

                <Divider className="m-0" />

                {/* Categories */}
                <div className="px-4 py-3">
                    {service.categories.length > 0 ? (
                        <Flex vertical gap={10}>
                            {service.categories.map((category, categoryIndex) => (
                                <DraggableCategory
                                    key={category.id}
                                    parentId={service.id}
                                    index={categoryIndex}
                                    category={category}
                                    moveCategory={moveCategory}
                                    moveLeaf={moveLeaf}
                                    onRename={label => onRenameCategory(category.id, label)}
                                    onDelete={() => onDeleteCategory(category.id, category.label)}
                                    onAddLeaf={() => onAddLeaf(category.id, category.label)}
                                    onRenameLeaf={(leafId, label) =>
                                        onRenameLeaf(category.id, leafId, label)
                                    }
                                    onDeleteLeaf={(leafId, label) =>
                                        onDeleteLeaf(category.id, leafId, label)
                                    }
                                />
                            ))}
                        </Flex>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            className="my-2"
                            description={
                                <Typography.Text type="secondary" className="text-xs">
                                    No categories yet — add one to get started
                                </Typography.Text>
                            }
                        />
                    )}
                </div>
            </Card>
        </div>
    );
};

export default DraggableServiceCard;
