type FileType = 'pdf' | 'csv' | 'xlsx';

const useFileDownloader = () => {
    const handleDownload = (data: any, filename: string, fileType: FileType) => {
        if (!data) return;

        let mimeType = '';

        switch (fileType) {
            case 'pdf':
                mimeType = 'application/pdf';
                break;
            case 'csv':
                mimeType = 'text/csv';
                break;
            case 'xlsx':
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            default:
                throw new Error('Unsupported file type');
        }

        const blobData = new Blob([data], { type: mimeType });

        if (!blobData) return;

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blobData);
        link.download = `${filename}.${fileType}`;
        link.click();
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

    return { handleDownload, handleDownloadLink };
};

export default useFileDownloader;
