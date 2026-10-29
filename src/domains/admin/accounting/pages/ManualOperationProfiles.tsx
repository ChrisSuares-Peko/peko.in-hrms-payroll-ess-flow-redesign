import { ComponentType } from 'react';

import { Navigate, useParams } from 'react-router-dom';

import PartnerLedgerList from './PartnerLedgerList';
import PaymentGatewayLedgerList from './PaymentGatewayLedgerList';
import SubscriberLedgerList from './SubscriberLedgerList';
import VendorLedgerList from './VendorLedgerList';
import { LedgerKind, LedgerListProps } from '../config/ledgerPaths';
import { findManualOperation, manualOperationsPath } from '../config/manualOperations';

const PROFILE_LISTS: Record<LedgerKind, ComponentType<LedgerListProps>> = {
    vendors: VendorLedgerList,
    subscribers: SubscriberLedgerList,
    partners: PartnerLedgerList,
    payment_gateways: PaymentGatewayLedgerList,
};

const ManualOperationProfiles = () => {
    const { operation: key } = useParams();
    const operation = findManualOperation(key);

    if (!operation || !operation.ledger) return <Navigate to={manualOperationsPath()} replace />;

    const List = PROFILE_LISTS[operation.ledger.kind];
    return <List openTab={operation.ledger.tab} intro={operation.ledger.pickIntro} />;
};

export default ManualOperationProfiles;
