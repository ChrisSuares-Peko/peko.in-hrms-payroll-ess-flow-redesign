import { FC } from 'react';

import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Flex } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const workerUrl = `/javascript/pdf.worker.min.js`;

interface PreviewerProps {}

const Previewer: FC<PreviewerProps> = () => {
    const pdfUrl = useAppSelector(state => state.reducer.eSignDoc.document_url);
    const newPlugin = defaultLayoutPlugin();
    return (
        <Flex vertical align="center" className="w-full ">
            <Flex className="w-1/2 h-100">
                {pdfUrl && (
                    <Worker workerUrl={workerUrl}>
                        <Viewer fileUrl={pdfUrl} plugins={[newPlugin]} />
                    </Worker>
                )}
            </Flex>
        </Flex>
    );
};

export default Previewer;
