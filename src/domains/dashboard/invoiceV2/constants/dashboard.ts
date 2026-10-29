import agingAnalysisImg from '../assets/icons/dashboard/agingAnalysis.svg';
import bankAccountImg from '../assets/icons/dashboard/bank_account.svg';
import catalogueImg from '../assets/icons/dashboard/catalogue.svg';
import createInvoiceImg from '../assets/icons/dashboard/create_invoice.svg';
import creditNotesImg from '../assets/icons/dashboard/creditNotes.svg';
import customersImg from '../assets/icons/dashboard/customers.svg';
import eInvoiceImg from '../assets/icons/dashboard/e-Invoice.svg';
import paymentImg from '../assets/icons/dashboard/payment.svg';
import paymentsReceivedImg from '../assets/icons/dashboard/payments.svg';
import quotationImg from '../assets/icons/dashboard/quotation.svg';
import remindersImg from '../assets/icons/dashboard/reminders.svg';
import settingsImg from '../assets/icons/dashboard/settings.svg';
import emptyWalletImg from '../assets/icons/empty-wallet.svg';
import moneySendImg from '../assets/icons/money-send2.svg';
import statusUpImg from '../assets/icons/status-up.svg';

export const STAT_CARDS_CONFIG = [
    { id: 'total-sales', label: 'Total Sales', bgColor: '#FDF6F0', icon: statusUpImg },
    { id: 'amount-received', label: 'Amount Received', bgColor: '#EBF6F1', icon: moneySendImg },
    {
        id: 'outstanding-amount',
        label: 'Outstanding Amount',
        bgColor: '#ECF0FC',
        icon: emptyWalletImg,
    },
] as const;

export const QUICK_ACCESS_CONFIG = [
    { id: 'create-invoice', label: 'All Invoices', icon: createInvoiceImg },
    { id: 'quotation', label: 'Quotation', icon: quotationImg },
    { id: 'credit-notes', label: 'Credit Notes', icon: creditNotesImg },
    { id: 'e-invoice', label: 'E-Invoice', icon: eInvoiceImg },
    { id: 'customers', label: 'Customers', icon: customersImg },
    { id: 'catalog', label: 'Catalog', icon: catalogueImg },
    { id: 'bank-account', label: 'Manage Bank Account', icon: bankAccountImg },
    { id: 'collect-payment', label: 'Collect Payment Against Invoice', icon: paymentImg },
    { id: 'aging-analysis', label: 'Analytics', icon: agingAnalysisImg },
    { id: 'reminders', label: 'Reminders', icon: remindersImg },
    { id: 'settings', label: 'Settings', icon: settingsImg },
    { id: 'payments', label: 'Payments', icon: paymentsReceivedImg },
] as const;
