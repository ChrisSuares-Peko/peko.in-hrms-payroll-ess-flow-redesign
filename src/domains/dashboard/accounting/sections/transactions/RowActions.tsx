import {
    EditOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    PaperClipOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Button, Flex, Tooltip } from 'antd';

interface RowActionsProps {
    isHidden?: boolean;
    onEdit?: () => void;
    onAttach?: () => void;
    onRecurring?: () => void;
    onToggleHide?: () => void;
}

const iconBtn =
    '!size-9 lg:!size-8 !rounded-lg !p-0 !text-slate-400 hover:!bg-slate-100 hover:!text-bodyText';

const RowActions = ({
    isHidden = false,
    onEdit,
    onAttach,
    onRecurring,
    onToggleHide,
}: RowActionsProps) => (
    <Flex align="center" gap={4}>
        <Tooltip title="Edit note">
            <Button
                type="text"
                aria-label="Edit note"
                onClick={onEdit}
                icon={<EditOutlined />}
                className={iconBtn}
            />
        </Tooltip>
        <Tooltip title="Attach document">
            <Button
                type="text"
                aria-label="Attach document"
                onClick={onAttach}
                icon={<PaperClipOutlined />}
                className={iconBtn}
            />
        </Tooltip>
        <Tooltip title="Mark recurring">
            <Button
                type="text"
                aria-label="Mark recurring"
                onClick={onRecurring}
                icon={<SyncOutlined />}
                className={iconBtn}
            />
        </Tooltip>
        <Tooltip title={isHidden ? 'Unhide' : 'Hide'}>
            <Button
                type="text"
                aria-label={isHidden ? 'Unhide transaction' : 'Hide transaction'}
                onClick={onToggleHide}
                icon={isHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                className="!size-9 lg:!size-8 !rounded-lg !p-0 !text-danger hover:!bg-red-50 hover:!text-danger"
            />
        </Tooltip>
    </Flex>
);

export default RowActions;
