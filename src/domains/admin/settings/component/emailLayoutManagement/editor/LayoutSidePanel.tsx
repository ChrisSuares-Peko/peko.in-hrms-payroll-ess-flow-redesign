import { Flex, Typography } from 'antd';

import LayoutVariablesPanel from './LayoutVariablesPanel';

type LayoutSidePanelProps = {
    html: string;
    sampleDataRaw: string;
    onSampleDataChange: (value: string) => void;
    onInsertVariable: (token: string) => void;
};

const LayoutSidePanel = ({
    html,
    sampleDataRaw,
    onSampleDataChange,
    onInsertVariable,
}: LayoutSidePanelProps) => (
    <Flex vertical gap={12} className="h-full min-h-0">
        <Typography.Text className="font-medium">Variables</Typography.Text>
        <div className="flex-1 min-h-0">
            <LayoutVariablesPanel
                html={html}
                sampleDataRaw={sampleDataRaw}
                onSampleDataChange={onSampleDataChange}
                onInsertVariable={onInsertVariable}
            />
        </div>
    </Flex>
);

export default LayoutSidePanel;
