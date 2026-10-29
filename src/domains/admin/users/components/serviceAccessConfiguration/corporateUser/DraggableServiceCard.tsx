import { useRef } from 'react';

import { DeleteOutlined, EditOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Empty, Flex, Tag, Tooltip, Typography } from 'antd';
import { useDrag, useDrop } from 'react-dnd';

import DraggableSubService from './DraggableSubService';
import { CorpServiceNode, CORP_SERVICE_DND_TYPE } from '../../../types/systemUserTypes';

interface DragItem {
    index: number;
}

interface DraggableServiceCardProps {
    index: number;
    service: CorpServiceNode;
    moveService: (dragIndex: number, hoverIndex: number) => void;
    moveSubService: (parentId: string, dragIndex: number, hoverIndex: number) => void;
    onRenameService: (label: string) => void;
    onEditService: () => void;
    onAddSubService: () => void;
    onDeleteService: () => void;
    onRenameSubService: (subServiceId: string, label: string) => void;
    onEditSubService: (subServiceId: string) => void;
    onDeleteSubService: (subServiceId: string, label: string) => void;
}

// A corporate service card (L1): drag by the grip to reorder, rename inline, add a
// sub-service, or delete. Sub-services (L2) render inside as draggable chips. Shares
// the brand (red) theme with the System User configuration for consistency.
const DraggableServiceCard = ({
    index,
    service,
    moveService,
    moveSubService,
    onRenameService,
    onEditService,
    onAddSubService,
    onDeleteService,
    onRenameSubService,
    onEditSubService,
    onDeleteSubService,
}: DraggableServiceCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);

    const [, drop] = useDrop<DragItem>({
        accept: CORP_SERVICE_DND_TYPE,
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
        type: CORP_SERVICE_DND_TYPE,
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

                    <Flex align="center" gap={8} className="min-w-0 flex-1">
                        <Typography.Text
                            strong
                            className="text-base text-fontHead"
                            editable={{
                                onChange: value => value.trim() && onRenameService(value.trim()),
                                tooltip: 'Click to rename service',
                                triggerType: ['text'],
                            }}
                            ellipsis
                        >
                            {service.label}
                        </Typography.Text>
                        {service.enableMoreService && (
                            <Tag className="m-0 rounded-full text-[0.65rem]">More Services</Tag>
                        )}
                        {service.accessKey && (
                            <Tag color="red" className="m-0 rounded-full text-[0.65rem]">
                                {service.accessKey}
                            </Tag>
                        )}
                    </Flex>

                    <Tooltip title="Add sub-service">
                        <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<PlusOutlined />}
                            onClick={onAddSubService}
                        >
                            Sub-service
                        </Button>
                    </Tooltip>
                    <Tooltip title="Edit service">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={onEditService}
                            className="!text-brandColor"
                        />
                    </Tooltip>
                    <Tooltip title="Delete service">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={onDeleteService}
                        />
                    </Tooltip>
                </Flex>

                <Divider className="m-0" />

                {/* Sub-services */}
                <div className="px-4 py-3">
                    {service.subServices.length > 0 ? (
                        <Flex wrap="wrap" gap={8}>
                            {service.subServices.map((sub, subIndex) => (
                                <DraggableSubService
                                    key={sub.id}
                                    parentId={service.id}
                                    index={subIndex}
                                    subService={sub}
                                    moveSubService={moveSubService}
                                    onRename={label => onRenameSubService(sub.id, label)}
                                    onEdit={() => onEditSubService(sub.id)}
                                    onDelete={() => onDeleteSubService(sub.id, sub.label)}
                                />
                            ))}
                        </Flex>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            className="my-2"
                            description={
                                <Typography.Text type="secondary" className="text-xs">
                                    No sub-services yet — add one to get started
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
