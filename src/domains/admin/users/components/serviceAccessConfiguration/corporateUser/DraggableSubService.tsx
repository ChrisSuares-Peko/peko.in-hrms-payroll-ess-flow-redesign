import { useRef } from 'react';

import { DeleteOutlined, EditOutlined, HolderOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useDrag, useDrop } from 'react-dnd';

import { CorpSubServiceNode, CORP_SUBSERVICE_DND_TYPE } from '../../../types/systemUserTypes';

interface DragItem {
    index: number;
    parentId: string;
}

interface DraggableSubServiceProps {
    parentId: string;
    index: number;
    subService: CorpSubServiceNode;
    moveSubService: (parentId: string, dragIndex: number, hoverIndex: number) => void;
    onRename: (label: string) => void;
    onEdit: () => void;
    onDelete: () => void;
}

// A corporate sub-service (L2) chip: drag by the grip to reorder within its parent
// service, rename inline, or delete. Reordering is scoped to the same service.
const DraggableSubService = ({
    parentId,
    index,
    subService,
    moveSubService,
    onRename,
    onEdit,
    onDelete,
}: DraggableSubServiceProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);

    const [, drop] = useDrop<DragItem>({
        accept: CORP_SUBSERVICE_DND_TYPE,
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

            moveSubService(parentId, dragIndex, hoverIndex);
             
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: CORP_SUBSERVICE_DND_TYPE,
        item: () => ({ index, parentId }),
        collect: monitor => ({ isDragging: monitor.isDragging() }),
    });

    preview(drop(ref));
    drag(handleRef);

    return (
        <div ref={ref}>
            <Flex
                align="center"
                gap={8}
                className={`rounded-full border px-3 py-1 transition-all duration-150 ${
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
                    className="text-sm text-fontHead"
                    editable={{
                        onChange: value => value.trim() && onRename(value.trim()),
                        tooltip: 'Click to rename',
                        triggerType: ['text'],
                    }}
                >
                    {subService.label}
                </Typography.Text>
                {subService.accessKey && (
                    <Typography.Text
                        type="secondary"
                        className="text-[0.65rem] text-brandColor"
                        title="Access key"
                    >
                        {subService.accessKey}
                    </Typography.Text>
                )}
                <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={onEdit}
                    className="!text-brandColor"
                />
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

export default DraggableSubService;
