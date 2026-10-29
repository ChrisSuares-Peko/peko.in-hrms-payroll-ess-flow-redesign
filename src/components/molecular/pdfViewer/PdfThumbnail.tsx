import * as React from 'react';

import { Viewer, Worker } from '@react-pdf-viewer/core';
import type { Plugin, RenderViewer } from '@react-pdf-viewer/core';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import '@react-pdf-viewer/core/lib/styles/index.css';

interface PdfThumbnailProps {
    fileUrl: string;
    pageIndex?: number;
}

const pageThumbnailPlugin = (props: { PageThumbnail: React.ReactElement }): Plugin => {
    const { PageThumbnail } = props;
    return {
        renderViewer: (renderProps: RenderViewer) => {
            const { slot } = renderProps;

            slot.children = PageThumbnail;

            // Reset the sub slot if it exists
            if (slot.subSlot) {
                slot.subSlot.attrs = {};
                slot.subSlot.children = null;
            }
            return slot;
        },
    };
};

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({ fileUrl, pageIndex = 0 }) => {
    const thumbnailPluginInstance = thumbnailPlugin();
    const { Cover } = thumbnailPluginInstance;
    const pageThumbnailPluginInstance = pageThumbnailPlugin({
        PageThumbnail: <Cover getPageIndex={() => pageIndex} />,
    });

    return (
        <Worker workerUrl="/javascript/pdf.worker.min.js">
            <Viewer
                fileUrl={fileUrl}
                plugins={[pageThumbnailPluginInstance, thumbnailPluginInstance]}
            />
        </Worker>
    );
};

export default PdfThumbnail;
