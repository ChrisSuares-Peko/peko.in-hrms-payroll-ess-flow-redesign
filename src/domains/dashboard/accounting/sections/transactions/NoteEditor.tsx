import { useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';

interface NoteEditorProps {
    initialValue?: string;
    onSave?: (value: string) => void;
    onCancel?: () => void;
}

const NoteEditor = ({ initialValue = '', onSave, onCancel }: NoteEditorProps) => {
    const [value, setValue] = useState(initialValue);

    return (
        <Flex vertical gap={8} className="w-full max-w-md">
            <Input.TextArea
                value={value}
                onChange={event => setValue(event.target.value)}
                placeholder="Add notes..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                className="!rounded-xl !border-borderStrong !text-sm"
            />
            <Flex align="center" gap={20}>
                <Button
                    type="link"
                    onClick={() => onSave?.(value.trim())}
                    icon={<CheckCircleFilled />}
                    className="!h-auto !p-0 !text-sm !font-medium !text-success hover:!opacity-80"
                >
                    Save
                </Button>
                <Button
                    type="link"
                    onClick={onCancel}
                    className="!h-auto !p-0 !text-sm !font-medium !text-muted hover:!text-bodyText"
                >
                    Cancel
                </Button>
            </Flex>
        </Flex>
    );
};

export default NoteEditor;
