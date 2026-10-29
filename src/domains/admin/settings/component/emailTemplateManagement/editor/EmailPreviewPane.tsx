import { useMemo, useState } from 'react';

import { Alert, Flex, Segmented } from 'antd';

import { renderEmailPreview } from './previewRenderer';
import { parseSampleData } from './SampleDataEditor';

type PreviewViewport = 'desktop' | 'mobile';

type EmailPreviewPaneProps = {
    templateHtml: string;
    sampleDataRaw: string;
    // Merged on top of parsed sample data, e.g. selected header/footer layout HTML.
    extraSampleData?: Record<string, string>;
};

const VIEWPORT_WIDTH: Record<PreviewViewport, number | string> = {
    desktop: 700,
    mobile: 375,
};

const EmailPreviewPane = ({
    templateHtml,
    sampleDataRaw,
    extraSampleData,
}: EmailPreviewPaneProps) => {
    const [viewport, setViewport] = useState<PreviewViewport>('desktop');

    const parsedSampleData = useMemo(() => parseSampleData(sampleDataRaw), [sampleDataRaw]);

    const renderResult = useMemo(() => {
        if (parsedSampleData.status === 'invalid') return null;
        const data = parsedSampleData.status === 'valid' ? parsedSampleData.data : {};
        return renderEmailPreview(templateHtml, { ...data, ...extraSampleData });
    }, [templateHtml, parsedSampleData, extraSampleData]);

    return (
        <Flex vertical gap={12} className="h-full min-h-0">
            {parsedSampleData.status === 'invalid' && (
                <Alert
                    type="error"
                    showIcon
                    message="Invalid JSON"
                    description="Please correct the sample data before previewing."
                />
            )}
            {renderResult?.status === 'error' && (
                <Alert type="error" showIcon message={renderResult.message} />
            )}
            {renderResult?.status === 'success' && renderResult.missingVariablePaths.length > 0 && (
                <Alert
                    type="warning"
                    showIcon
                    message="Missing sample data"
                    description={renderResult.missingVariablePaths.join(', ')}
                />
            )}
            {/* relative on wrapper, not the scroll area, so the toggle stays fixed while previewing scrolls */}
            <div className="flex-1 min-h-0 relative">
                <Segmented
                    options={[
                        { label: 'Desktop', value: 'desktop' },
                        { label: 'Mobile', value: 'mobile' },
                    ]}
                    value={viewport}
                    onChange={value => setViewport(value as PreviewViewport)}
                    size="small"
                    className="absolute top-3 right-3 z-10 shadow-sm"
                />
                <Flex justify="center" className="h-full bg-bgGrayF8 rounded-md p-4 overflow-auto">
                    {renderResult?.status === 'success' && (
                        <iframe
                            title="Email preview"
                            srcDoc={renderResult.html}
                            sandbox=""
                            style={{
                                width: VIEWPORT_WIDTH[viewport],
                                maxWidth: '100%',
                                height: '100%',
                                minHeight: 480,
                                border: '1px solid #E4E7EC',
                                borderRadius: 6,
                                background: '#fff',
                                transition: 'width 0.2s ease',
                            }}
                        />
                    )}
                </Flex>
            </div>
        </Flex>
    );
};

export default EmailPreviewPane;
