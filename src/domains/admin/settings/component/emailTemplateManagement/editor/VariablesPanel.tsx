import { PlusOutlined } from '@ant-design/icons';
import { Flex, Input, Spin, Tooltip, Typography } from 'antd';

import { parseSampleData } from './SampleDataEditor';

type VariablesPanelProps = {
    variables: string[];
    loading: boolean;
    sampleDataRaw: string;
    onSampleDataChange: (value: string) => void;
    onInsert: (text: string) => void;
};

// Sentence-cases a camelCase variable name for display only — the inserted
// placeholder and the sample-data key always use the exact raw name.
const toLabel = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

const VariablesPanel = ({
    variables,
    loading,
    sampleDataRaw,
    onSampleDataChange,
    onInsert,
}: VariablesPanelProps) => {
    const parsed = parseSampleData(sampleDataRaw);
    const data = parsed.status === 'valid' ? parsed.data : {};

    const handleValueChange = (name: string, value: string) => {
        const next = { ...data, [name]: value };
        onSampleDataChange(JSON.stringify(next, null, 2));
    };

    if (loading) {
        return (
            <Flex justify="center" className="py-8">
                <Spin size="small" />
            </Flex>
        );
    }

    if (!variables.length) {
        return (
            <Typography.Text className="text-textGray text-xs">
                No documented variables for this template key.
            </Typography.Text>
        );
    }

    return (
        <Flex vertical gap={12}>
            <Typography.Text className="text-textGray text-xs">
                These are the ${'{variable}'} placeholders this key&apos;s send site actually fills
                in. Insert one into the HTML, or give it a sample value to preview with — sample
                values are never saved to the template.
            </Typography.Text>
            <Flex vertical>
                {variables.map(name => (
                    <Flex
                        key={name}
                        align="center"
                        gap={8}
                        className="border-b border-borderGray py-2 last:border-b-0"
                    >
                        <Tooltip title={`Insert \${${name}} into the HTML`}>
                            <PlusOutlined
                                className="cursor-pointer text-brandColor"
                                onClick={() => onInsert(`\${${name}}`)}
                            />
                        </Tooltip>
                        <Typography.Text className="font-medium shrink-0" title={name}>
                            {toLabel(name)}
                        </Typography.Text>
                        <Input
                            variant="borderless"
                            placeholder="Enter value"
                            className="flex-1 min-w-0"
                            style={{ textAlign: 'right' }}
                            value={typeof data[name] === 'string' ? (data[name] as string) : ''}
                            onChange={e => handleValueChange(name, e.target.value)}
                        />
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
};

export default VariablesPanel;
