import { useState } from 'react';

import { getDocument } from '@src/services/userInfo';

import { useAppSelector } from './store';

type FileType =
    | 'pdf'
    | 'csv'
    | 'xlsx'
    | 'png'
    | 'jpg'
    | 'jpeg'
    | 'gif'
    | 'svg'
    | 'webp'
    | 'bmp'
    | 'txt'
    | 'json'
    | 'zip'
    | 'docx'
    | 'pptx'
    | 'mp3'
    | 'mp4'
    | 'vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const useFileDownloader = () => {
    const { role: userType, id: userId } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const handleDownload = (data: any, filename: string, fileType: FileType) => {
        try {
            if (!data) return;
            const mimeType = getMimeType(fileType);
            const extension = getFileType(fileType);
            const blobData = new Blob([data], { type: mimeType });

            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blobData);
            link.download = `${filename}.${extension}`;
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDownloadLink = (url: string) => {
        if (!url) return;
        // Convert HTTP to HTTPS if necessary
        const httpsUrl = url.replace(/^http:\/\//i, 'https://');
        const link = document.createElement('a');
        link.href = httpsUrl;
        link.target = '_blank'; // Open in a new tab
        link.click();
    };

    const downloadDocument = async (doc: string) => {
        setIsLoading(true);
        if (isUrl(doc)) {
            handleDownloadLink(doc);
        } else {
            try {
                const data = await getDocument({ key: doc, userId, userType });

                if (data) {
                    const arrayBuffer = new Uint8Array(data.buffer.data);
                    const extension = data.type;
                    handleDownload(arrayBuffer, 'document', extension);
                }
            } catch (err) {
                console.error('Error fetching document:', err);
            }
        }
        setIsLoading(false);
    };

    const isUrl = (str: string): boolean => {
        try {
            const url = new URL(str);
            return !!url;
        } catch {
            return false;
        }
    };

    return { handleDownload, handleDownloadLink, downloadDocument, isLoading };
};

const getFileType = (fileType: FileType): string => {
    switch (fileType) {
        case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            return 'xlsx';
        case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'docx';
        default:
            return fileType;
    }
};

const getMimeType = (fileType: FileType): string => {
    switch (fileType) {
        case 'pdf':
            return 'application/pdf';
        case 'csv':
            return 'text/csv';
        case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        /** Images */
        case 'png':
            return 'image/png';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'gif':
            return 'image/gif';
        case 'svg':
            return 'image/svg+xml';
        case 'webp':
            return 'image/webp';
        case 'bmp':
            return 'image/bmp';

        /** Text / Data */
        case 'txt':
            return 'text/plain';
        case 'json':
            return 'application/json';

        /** Archives */
        case 'zip':
            return 'application/zip';

        /** Office */
        case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'application/docx';
        case 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'pptx':
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

        /** Media */
        case 'mp3':
            return 'audio/mpeg';
        case 'mp4':
            return 'video/mp4';

        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }
};

export default useFileDownloader;
