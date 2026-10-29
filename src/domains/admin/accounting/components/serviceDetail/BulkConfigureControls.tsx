import { Button, Flex } from 'antd';

type BulkConfigureControlsProps = {
    selectionMode: boolean;
    selectedCount: number;
    disabled?: boolean;
    onStart: () => void;
    onCancel: () => void;
    onConfigure: () => void;
};

const BulkConfigureControls = ({
    selectionMode,
    selectedCount,
    disabled,
    onStart,
    onCancel,
    onConfigure,
}: BulkConfigureControlsProps) => {
    if (!selectionMode) {
        return (
            <Button onClick={onStart} disabled={disabled}>
                Bulk configure
            </Button>
        );
    }

    return (
        <Flex gap={8}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" disabled={!selectedCount} onClick={onConfigure}>
                {selectedCount ? `Configure ${selectedCount} selected` : 'Select rows'}
            </Button>
        </Flex>
    );
};

export default BulkConfigureControls;
