type StoredDoc = { docType?: string; fileName?: string; fileString?: string };

const getAt = (obj: unknown, path: string) =>
    path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], obj);

const setAt = (root: Record<string, unknown>, path: string, value: unknown) => {
    const keys = path.split('.');
    let node: Record<string, unknown> = root;
    keys.forEach((key, i) => {
        if (i === keys.length - 1) {
            node[key] = value;
            return;
        }
        if (node[key] == null) node[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
        node = node[key] as Record<string, unknown>;
    });
};

// On resume the form seeds from applicationData, but uploaded files live in the
// server's separate `documents` list (base64 dropped — only the filename ref
// remains). Re-attach each confirmed file to its Formik field so previously
// uploaded documents still show as uploaded after a page refresh.
// vendorConfirmedOnly: clear filenames the vendor never accepted (they'd read as a tick).
export const restoreDocuments = (
    applicationData: Record<string, unknown>,
    storedDocs?: StoredDoc[],
    vendorConfirmedOnly = false
): Record<string, unknown> => {
    if (!Array.isArray(storedDocs) || !storedDocs.length) return applicationData;
    const next = { ...applicationData };
    storedDocs.forEach(d => {
        if (!d?.docType) return;
        // docType is the field path with '.' -> '_' — reverse it to place the
        // filename back on the matching field (no doc key contains '_').
        const fieldPath = `documents.${d.docType.replace(/_/g, '.')}`;
        // Only docs already pushed to the vendor (base64 dropped) count as uploaded.
        if (d.fileName && !d.fileString) {
            if (!getAt(next, fieldPath)) setAt(next, fieldPath, d.fileName);
        } else if (vendorConfirmedOnly && typeof getAt(next, fieldPath) === 'string') {
            setAt(next, fieldPath, '');
        }
    });
    return next;
};
