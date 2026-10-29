import { RefObject, useEffect } from 'react';

import { Flex, Segmented } from 'antd';

import EmailPreviewPane from './EmailPreviewPane';
import HtmlCodeMirrorEditor, { HtmlEditorHandle } from './HtmlCodeMirrorEditor';

type MainWorkspaceTab = 'html' | 'preview';

// Fixed height, not stretched — Preview (sharing this container) benefits from full height, the editor doesn't.
const HTML_EDITOR_HEIGHT = 420;

type MainWorkspaceProps = {
    html: string;
    onHtmlChange: (value: string) => void;
    sampleDataRaw: string;
    htmlEditorRef: RefObject<HtmlEditorHandle>;
    activeTab: MainWorkspaceTab;
    onActiveTabChange: (tab: MainWorkspaceTab) => void;
    // Merged on top of sample data for preview, e.g. resolved header/footer layout HTML.
    extraSampleData?: Record<string, string>;
};

const MainWorkspace = ({
    html,
    onHtmlChange,
    sampleDataRaw,
    htmlEditorRef,
    activeTab,
    onActiveTabChange,
    extraSampleData,
}: MainWorkspaceProps) => {
    useEffect(() => {
        if (activeTab === 'html') htmlEditorRef.current?.layout();
    }, [activeTab, htmlEditorRef]);

    return (
        <Flex vertical gap={12} className="h-full min-h-0">
            <Segmented
                options={[
                    { label: 'HTML', value: 'html' },
                    { label: 'Preview', value: 'preview' },
                ]}
                value={activeTab}
                onChange={value => onActiveTabChange(value as MainWorkspaceTab)}
            />
            {/* Both panes stay mounted (CSS-toggled) so CodeMirror's undo history/cursor survives tab switches. */}
            <div className="flex-1 min-h-0 relative">
                <div className={`absolute inset-0 ${activeTab === 'html' ? 'block' : 'hidden'}`}>
                    <div
                        style={{ height: HTML_EDITOR_HEIGHT }}
                        className="border border-borderGray rounded-md overflow-hidden"
                    >
                        <HtmlCodeMirrorEditor
                            ref={htmlEditorRef}
                            value={html}
                            onChange={onHtmlChange}
                        />
                    </div>
                </div>
                <div className={`absolute inset-0 ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
                    <EmailPreviewPane
                        templateHtml={html}
                        sampleDataRaw={sampleDataRaw}
                        extraSampleData={extraSampleData}
                    />
                </div>
            </div>
        </Flex>
    );
};

export default MainWorkspace;
