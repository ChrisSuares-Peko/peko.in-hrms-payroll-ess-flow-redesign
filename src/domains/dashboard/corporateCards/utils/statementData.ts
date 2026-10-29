/** Copy for the admin "Account Statement" page (under Accounting). The tiles + table are API-backed. */
export const STATEMENT_COPY = {
    title: 'Account Statement',
    subtitle: 'Monthly statement for reconciliation.',
    selectDate: 'Select Date',
    print: 'Print',
    exportCsv: 'Export CSV',
    note: 'Note: Internal transfers between the main wallet and cards (and between cards via the wallet) are excluded from this statement, as they do not change your overall account balance.',
    /** Rendered in any empty statement cell. */
    emptyCell: '--',
} as const;
