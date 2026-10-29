import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import LedgerStatementPanel, {
    LedgerStatementFilters,
    StatementFormat,
} from './LedgerStatementPanel';
import {
    downloadPaymentGatewayStatement,
    getPaymentGatewayStatement,
} from '../../api/paymentGatewayLedger';

export const PAYMENT_GATEWAY_STATEMENT_CONVENTION =
    'A debit is money the gateway took in and owes Peko. A credit is money it handed over, or kept as its charge. The closing balance is what is still to come.';

type PaymentGatewayStatementPanelProps = {
    gatewayId: string;
    gatewayName: string;
    range: { from: string; to: string };
};

const PaymentGatewayStatementPanel = ({
    gatewayId,
    gatewayName,
    range,
}: PaymentGatewayStatementPanelProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const load = useCallback(
        (filters: LedgerStatementFilters) =>
            getPaymentGatewayStatement({ userId: id, userType: role, gatewayId, ...filters }),
        [id, role, gatewayId]
    );

    const download = useCallback(
        (format: StatementFormat, filters: LedgerStatementFilters) =>
            downloadPaymentGatewayStatement({
                userId: id,
                userType: role,
                gatewayId,
                format,
                ...filters,
            }),
        [id, role, gatewayId]
    );

    return (
        <LedgerStatementPanel
            description={`What ${gatewayName} collected on each order, what it handed over and what it kept, one line per movement; a collection whose entry has not reached the books is listed with no amount. Every order is on the Transactions tab.`}
            partyName={gatewayName}
            range={range}
            convention={PAYMENT_GATEWAY_STATEMENT_CONVENTION}
            filterable
            load={load}
            download={download}
        />
    );
};

export default PaymentGatewayStatementPanel;
