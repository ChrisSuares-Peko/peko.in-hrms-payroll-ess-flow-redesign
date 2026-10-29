import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

type EntryChangeActionsProps = {
    label: string;
    canUpdate: boolean;
    changeable?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onReverse: () => void;
};

const EntryChangeActions = ({
    label,
    canUpdate,
    changeable = true,
    onEdit,
    onDelete,
    onReverse,
}: EntryChangeActionsProps) => (
    <>
        {changeable && (
            <>
                <Tooltip title={canUpdate ? `Edit ${label}` : NO_PERMISSION}>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        aria-label={`Edit ${label}`}
                        disabled={!canUpdate}
                        onClick={onEdit}
                    />
                </Tooltip>
                <Tooltip title={canUpdate ? `Delete ${label}` : NO_PERMISSION}>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`Delete ${label}`}
                        disabled={!canUpdate}
                        onClick={onDelete}
                    />
                </Tooltip>
            </>
        )}
        <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
            <Button size="small" disabled={!canUpdate} onClick={onReverse}>
                Reverse
            </Button>
        </Tooltip>
    </>
);

export default EntryChangeActions;
