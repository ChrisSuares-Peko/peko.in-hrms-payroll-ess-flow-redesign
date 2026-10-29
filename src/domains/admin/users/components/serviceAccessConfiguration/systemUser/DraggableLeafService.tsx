import { useRef } from 'react';

import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useDrag, useDrop } from 'react-dnd';

import { LeafServiceNode, LEAF_DND_TYPE } from '../../../types/systemUserTypes';

interface DragItem {
    index: number;
    parentId: string;
}

interface DraggableLeafServiceProps {
    parentId: string;
    index: number;
    leaf: LeafServiceNode;
    moveLeaf: (parentId: string, dragIndex: number, hoverIndex: number) => void;
    onRename: (label: string) => void;
    onDelete: () => void;
}

// A single leaf service (L3) pill: drag by the grip to reorder within its parent
// category, rename inline, or delete. Reordering is scoped to the same category.
const DraggableLeafService = ({
    parentId,
    index,
    leaf,
    moveLeaf,
    onRename,
    onDelete,
}: DraggableLeafServiceProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);

    const [, drop] = useDrop<DragItem>({
        accept: LEAF_DND_TYPE,
        hover(item, monitor) {
            if (!ref.current) return;
            if (item.parentId !== parentId) return; // only reorder within the same category
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

            moveLeaf(parentId, dragIndex, hoverIndex);
             
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: LEAF_DND_TYPE,
        item: () => ({ index, parentId }),
        collect: monitor => ({ isDragging: monitor.isDragging() }),
    });

    preview(drop(ref));
    drag(handleRef);

    return (
        <div ref={ref}>
            <Flex
                align="center"
                gap={10}
                className={`rounded-md border px-3 py-1.5 transition-all duration-150 ${
                    isDragging
                        ? 'border-brandColor bg-red-50 opacity-40'
                        : 'border-borderGray bg-white hover:border-brandColor/40 hover:shadow-sm'
                }`}
            >
                <span
                    ref={handleRef}
                    title="Drag to reorder"
                    className="flex cursor-grab text-textGrey transition-colors hover:text-brandColor active:cursor-grabbing"
                >
                    <HolderOutlined />
                </span>
                <Typography.Text
                    className="flex-1 text-sm text-fontHead"
                    editable={{
                        onChange: value => value.trim() && onRename(value.trim()),
                        tooltip: 'Click to rename',
                        triggerType: ['text'],
                    }}
                    ellipsis
                >
                    {leaf.label}
                </Typography.Text>
                <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={onDelete}
                />
            </Flex>
        </div>
    );
};

export default DraggableLeafService;
