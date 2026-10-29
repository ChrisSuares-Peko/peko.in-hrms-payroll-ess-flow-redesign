import { useRef } from 'react';

import { DeleteOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Tooltip, Typography } from 'antd';
import { useDrag, useDrop } from 'react-dnd';

import DraggableLeafService from './DraggableLeafService';
import { CategoryNode, CATEGORY_DND_TYPE } from '../../../types/systemUserTypes';

interface DragItem {
    index: number;
    parentId: string;
}

interface DraggableCategoryProps {
    parentId: string;
    index: number;
    category: CategoryNode;
    moveCategory: (parentId: string, dragIndex: number, hoverIndex: number) => void;
    moveLeaf: (categoryId: string, dragIndex: number, hoverIndex: number) => void;
    onRename: (label: string) => void;
    onDelete: () => void;
    onAddLeaf: () => void;
    onRenameLeaf: (leafId: string, label: string) => void;
    onDeleteLeaf: (leafId: string, label: string) => void;
}

// A category (L2) section within a service card: drag by the grip to reorder within
// its parent service, rename inline, add a leaf service, or delete. Leaf services (L3)
// render inside and are independently draggable within this category.
const DraggableCategory = ({
    parentId,
    index,
    category,
    moveCategory,
    moveLeaf,
    onRename,
    onDelete,
    onAddLeaf,
    onRenameLeaf,
    onDeleteLeaf,
}: DraggableCategoryProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);

    const [, drop] = useDrop<DragItem>({
        accept: CATEGORY_DND_TYPE,
        hover(item, monitor) {
            if (!ref.current) return;
            if (item.parentId !== parentId) return; // only reorder within the same service
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

            moveCategory(parentId, dragIndex, hoverIndex);
             
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: CATEGORY_DND_TYPE,
        item: () => ({ index, parentId }),
        collect: monitor => ({ isDragging: monitor.isDragging() }),
    });

    preview(drop(ref));
    drag(handleRef);

    return (
        <div ref={ref}>
            <div
                className={`rounded-lg border transition-all duration-150 ${
                    isDragging
                        ? 'border-brandColor bg-red-50 opacity-40'
                        : 'border-borderGray bg-bgGray/40 hover:border-brandColor/40'
                }`}
            >
                {/* Category header */}
                <Flex align="center" gap={10} className="px-3 py-2">
                    <span
                        ref={handleRef}
                        title="Drag to reorder"
                        className="flex cursor-grab text-textGrey transition-colors hover:text-brandColor active:cursor-grabbing"
                    >
                        <HolderOutlined />
                    </span>
                    <Typography.Text
                        strong
                        className="flex-1 text-sm text-fontHead"
                        editable={{
                            onChange: value => value.trim() && onRename(value.trim()),
                            tooltip: 'Click to rename category',
                            triggerType: ['text'],
                        }}
                        ellipsis
                    >
                        {category.label}
                    </Typography.Text>
                    <Tooltip title="Add service">
                        <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<PlusOutlined />}
                            onClick={onAddLeaf}
                        >
                            Service
                        </Button>
                    </Tooltip>
                    <Tooltip title="Delete category">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={onDelete}
                        />
                    </Tooltip>
                </Flex>

                {/* Leaf services */}
                <div className="px-3 pb-3">
                    {category.services.length > 0 ? (
                        <Flex vertical gap={6}>
                            {category.services.map((leaf, leafIndex) => (
                                <DraggableLeafService
                                    key={leaf.id}
                                    parentId={category.id}
                                    index={leafIndex}
                                    leaf={leaf}
                                    moveLeaf={moveLeaf}
                                    onRename={label => onRenameLeaf(leaf.id, label)}
                                    onDelete={() => onDeleteLeaf(leaf.id, leaf.label)}
                                />
                            ))}
                        </Flex>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            className="my-1"
                            description={
                                <Typography.Text type="secondary" className="text-xs">
                                    No services yet
                                </Typography.Text>
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DraggableCategory;
