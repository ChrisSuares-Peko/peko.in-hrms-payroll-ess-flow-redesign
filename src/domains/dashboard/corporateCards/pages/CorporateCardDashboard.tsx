import { useState } from 'react';

import { TabbedDashboard } from '../components/common';
import { CorporateDashboardHome, MyRequestsSection } from '../components/corporate';
import ReimbursementsSection from '../components/corporate/reimbursements/ReimbursementsSection';
import VendorInvoicesSection from '../components/corporate/vendorInvoices/VendorInvoicesSection';
import { MyCardsTab } from '../components/landingPage/myCards';
import { TransactionsSection } from '../components/landingPage/transactions';
import { CORPORATE_TABS } from '../utils/data';

/**
 * Cardholder-facing Corporate Cards dashboard (Figma: corporate view).
 * Designed tabs go in the `content` map; everything else falls back to a Coming Soon page,
 * so other contributors can add a tab by dropping one entry here.
 */
const CorporateCardDashboard = () => {
    const [cardFilterRequest, setCardFilterRequest] = useState<string | undefined>(undefined);

    return (
        <TabbedDashboard
            tabs={CORPORATE_TABS}
            content={{
                dashboard: <CorporateDashboardHome />,
                cards: <MyCardsTab onCardTransactions={setCardFilterRequest} />,
                transactions: (
                    <TransactionsSection
                        variant="user"
                        initialCard={cardFilterRequest}
                        onInitialCardFilterConsumed={() => setCardFilterRequest(undefined)}
                    />
                ),
                'my-requests': <MyRequestsSection />,
                reimbursements: <ReimbursementsSection />,
                'vendor-invoices': <VendorInvoicesSection />,
            }}
        />
    );
};

export default CorporateCardDashboard;
