import { Flex, Form, Select, Typography } from 'antd';

import VariablesPanel from './VariablesPanel';
import useEmailLayoutOptions from '../../../hooks/useEmailLayoutOptions';
import { useEmailTemplateKeyVariables } from '../../../hooks/useEmailTemplateMetadata';

type SidePanelProps = {
    service: string;
    templateKey: string;
    sampleDataRaw: string;
    onSampleDataChange: (value: string) => void;
    onInsertIntoHtml: (text: string) => void;
    headerLayoutId: number | null;
    onHeaderLayoutChange: (id: number | null) => void;
    footerLayoutId: number | null;
    onFooterLayoutChange: (id: number | null) => void;
};

const SidePanel = ({
    service,
    templateKey,
    sampleDataRaw,
    onSampleDataChange,
    onInsertIntoHtml,
    headerLayoutId,
    onHeaderLayoutChange,
    footerLayoutId,
    onFooterLayoutChange,
}: SidePanelProps) => {
    const { variables, loading } = useEmailTemplateKeyVariables(
        service || undefined,
        templateKey || undefined
    );
    const { layouts: headerLayouts, isLoading: isLoadingHeaders } = useEmailLayoutOptions('HEADER');
    const { layouts: footerLayouts, isLoading: isLoadingFooters } = useEmailLayoutOptions('FOOTER');

    return (
        <Flex vertical gap={12} className="h-full min-h-0 overflow-y-auto">
            <Form layout="vertical">
                <Flex gap={12}>
                    <Form.Item label="Header" className="w-1/2 !mb-0">
                        <Select
                            value={headerLayoutId ?? undefined}
                            onChange={value => onHeaderLayoutChange(value ?? null)}
                            options={headerLayouts.map(({ id, name }) => ({
                                value: id,
                                label: name,
                            }))}
                            loading={isLoadingHeaders}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            placeholder="Select a header"
                        />
                    </Form.Item>
                    <Form.Item label="Footer" className="w-1/2 !mb-0">
                        <Select
                            value={footerLayoutId ?? undefined}
                            onChange={value => onFooterLayoutChange(value ?? null)}
                            options={footerLayouts.map(({ id, name }) => ({
                                value: id,
                                label: name,
                            }))}
                            loading={isLoadingFooters}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            placeholder="Select a footer"
                        />
                    </Form.Item>
                </Flex>
            </Form>
            <Typography.Text className="font-medium">Variables</Typography.Text>
            <VariablesPanel
                variables={variables}
                loading={loading}
                sampleDataRaw={sampleDataRaw}
                onSampleDataChange={onSampleDataChange}
                onInsert={onInsertIntoHtml}
            />
        </Flex>
    );
};

export default SidePanel;
