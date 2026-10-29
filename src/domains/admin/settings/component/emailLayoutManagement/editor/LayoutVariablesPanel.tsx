import { useMemo } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Empty, Flex, Input, Tooltip, Typography } from 'antd';

import { parseSampleData } from '../../emailTemplateManagement/editor/SampleDataEditor';
import { VARIABLE_TOKEN_REGEX } from '../../emailTemplateManagement/editor/templateSyntax';

// Matches VariablesPanel.tsx's inline `${name}` convention (no shared formatter exists here).
const formatVariableToken = (name: string) => `\${${name}}`;

type LayoutVariablesPanelProps = {
    html: string;
    sampleDataRaw: string;
    onSampleDataChange: (value: string) => void;
    onInsertVariable: (token: string) => void;
};

// Layouts aren't scoped to a service/templateKey, so unlike templates there's no variable
// registry — instead this derives the list from `${name}` tokens already typed in the HTML.
const LayoutVariablesPanel = ({
    html,
    sampleDataRaw,
    onSampleDataChange,
    onInsertVariable,
}: LayoutVariablesPanelProps) => {
    const variableNames = useMemo(() => {
        // Defensive fallback in case a future caller passes null/undefined.
        const matches = Array.from((html || '').matchAll(VARIABLE_TOKEN_REGEX), match => match[1]);
        return Array.from(new Set(matches)).sort();
    }, [html]);

    const sampleData = useMemo(() => {
        const parsed = parseSampleData(sampleDataRaw);
        return parsed.status === 'valid' ? parsed.data : {};
    }, [sampleDataRaw]);

    const handleSampleValueChange = (name: string, value: string) => {
        const next = { ...sampleData, [name]: value };
        onSampleDataChange(JSON.stringify(next, null, 2));
    };

    if (variableNames.length === 0) {
        return (
            <Flex align="center" justify="center" className="h-full">
                <Empty
                    description={`Type a ${formatVariableToken('variable')} placeholder into the HTML to see it here.`}
                />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={8} className="h-full overflow-auto">
            <Typography.Text className="text-textGray text-xs">
                These are the ${'{variable}'} placeholders used in this layout&apos;s HTML. Insert
                one again, or give it a sample value to preview with — sample values are never saved
                to the layout.
            </Typography.Text>
            {variableNames.map(name => (
                <Flex
                    key={name}
                    align="center"
                    gap={12}
                    className="border border-borderGray rounded-md px-3 py-2"
                >
                    <Tooltip title={`Insert ${formatVariableToken(name)} into the HTML`}>
                        <Flex
                            align="center"
                            gap={8}
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => onInsertVariable(formatVariableToken(name))}
                        >
                            <PlusOutlined className="text-brandColor text-base" />
                            <Typography.Text className="font-medium">{name}</Typography.Text>
                        </Flex>
                    </Tooltip>
                    <Input
                        variant="borderless"
                        value={
                            typeof sampleData[name] === 'string' ? (sampleData[name] as string) : ''
                        }
                        onChange={e => handleSampleValueChange(name, e.target.value)}
                        placeholder="Enter value"
                        className="flex-1 text-right"
                    />
                </Flex>
            ))}
        </Flex>
    );
};

export default LayoutVariablesPanel;
