import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import LedgerStatementPanel, {
    LedgerStatementFilters,
    StatementFormat,
} from './LedgerStatementPanel';
import { downloadPartnerStatement, getPartnerStatement } from '../../api/partnerLedger';

export const PARTNER_STATEMENT_CONVENTION =
    'A credit is share the partner earned and raises what Peko owes. A debit is a payout that settles it. The closing balance is what is still to be paid.';

type PartnerStatementPanelProps = {
    partnerId: string;
    partnerName: string;
    range: { from: string; to: string };
};

const PartnerStatementPanel = ({ partnerId, partnerName, range }: PartnerStatementPanelProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const load = useCallback(
        (filters: LedgerStatementFilters) =>
            getPartnerStatement({ userId: id, userType: role, partnerId, ...filters }),
        [id, role, partnerId]
    );

    const download = useCallback(
        (format: StatementFormat, filters: LedgerStatementFilters) =>
            downloadPartnerStatement({ userId: id, userType: role, partnerId, format, ...filters }),
        [id, role, partnerId]
    );

    return (
        <LedgerStatementPanel
            description={`What ${partnerName} earned on each order, what refunds took back, and the payouts and debit notes that settled it, one line per movement. Every order is on the Transactions and Own Subscriptions tabs.`}
            partyName={partnerName}
            range={range}
            convention={PARTNER_STATEMENT_CONVENTION}
            filterable
            load={load}
            download={download}
        />
    );
};

export default PartnerStatementPanel;
