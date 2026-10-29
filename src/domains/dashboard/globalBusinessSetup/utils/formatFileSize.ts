const formatBytes = (bytes: number) => {
    if (Number.isNaN(bytes)) return 'NA';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / k ** i;

    return `${parseFloat(size.toFixed(1))} ${units[i]}`;
};

export default formatBytes;
