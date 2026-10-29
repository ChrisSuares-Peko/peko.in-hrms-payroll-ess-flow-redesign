import { useCallback, useState } from 'react';

// Backs the "Bulk configure" flow on Plans/Platform Fee/Cashbacks — selections persist across page changes.
export default function useBulkRowSelection<T, K extends React.Key = number>(
    currentPageRows: T[],
    getId: (row: T) => K
) {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Map<K, T>>(new Map());

    const onSelectionChange = useCallback(
        (keys: React.Key[], _rowsOnPage: T[]) => {
            // Normalized to string since AntD doesn't guarantee it echoes keys back as the same type rowKey returned.
            const keptIds = new Set(keys.map(String));
            setSelectedRows(prev => {
                const next = new Map(prev);
                currentPageRows.forEach(row => {
                    const id = getId(row);
                    if (keptIds.has(String(id))) next.set(id, row);
                    else next.delete(id);
                });
                return next;
            });
        },
        [currentPageRows, getId]
    );

    const start = () => setSelectionMode(true);
    const reset = () => {
        setSelectionMode(false);
        setSelectedRows(new Map());
    };

    return {
        selectionMode,
        start,
        reset,
        selectedIds: Array.from(selectedRows.keys()),
        selectedRows: Array.from(selectedRows.values()),
        rowSelection: selectionMode
            ? {
                  selectedRowKeys: Array.from(selectedRows.keys()),
                  onChange: onSelectionChange,
                  preserveSelectedRowKeys: true,
              }
            : undefined,
    };
}
