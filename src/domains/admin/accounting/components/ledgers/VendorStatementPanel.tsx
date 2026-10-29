import { useCallback } from 'react';

import { Alert } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import LedgerStatementPanel, {
    LedgerStatementFilters,
    StatementFormat,
} from './LedgerStatementPanel';
import { downloadVendorStatement, getVendorStatement } from '../../api/vendorLedger';

export { statementColumns, withMarkers } from './LedgerStatementPanel';

export const STATEMENT_CONVENTION =
    'A debit raises the balance held with the vendor and a credit consumes it. Deposits and commissions are debits, order values and credit notes are credits, and commission carries its own tax in one line. A sale Peko made as principal is credited at the vendor’s price, without Peko’s markup.';

export const MISSING_OPENING_FOR_STATEMENT =
    'This vendor has no opening balance, so the opening line below starts at zero and every figure on the statement is short by whatever was owed before the portal started recording.';

type VendorStatementPanelProps = {
    vendorId: string;
    vendorName: string;
    range: { from: string; to: string };
    openingBalanceSet: boolean;
};

const VendorStatementPanel = ({
    vendorId,
    vendorName,
    range,
    openingBalanceSet,
}: VendorStatementPanelProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const load = useCallback(
        (filters: LedgerStatementFilters) =>
            getVendorStatement({ userId: id, userType: role, vendorId, ...filters }),
        [id, role, vendorId]
    );

    const download = useCallback(
        (format: StatementFormat, filters: LedgerStatementFilters) =>
            downloadVendorStatement({ userId: id, userType: role, vendorId, format, ...filters }),
        [id, role, vendorId]
    );

    return (
        <LedgerStatementPanel
            description={`Every movement on ${vendorName}'s account in date order, with a running balance.`}
            partyName={vendorName}
            range={range}
            convention={STATEMENT_CONVENTION}
            warning={
                !openingBalanceSet && (
                    <Alert
                        className="mb-4"
                        type="warning"
                        showIcon
                        message={MISSING_OPENING_FOR_STATEMENT}
                    />
                )
            }
            filterable
            searchPlaceholder="Search particulars, reference or type"
            load={load}
            download={download}
        />
    );
};

export default VendorStatementPanel;
