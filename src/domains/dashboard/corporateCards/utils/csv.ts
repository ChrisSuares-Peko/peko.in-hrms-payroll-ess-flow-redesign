/** Build a CSV string from headers + rows and trigger a client-side download. */
export const downloadCsv = (
    filename: string,
    headers: string[],
    rows: (string | number)[][]
): void => {
    const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
