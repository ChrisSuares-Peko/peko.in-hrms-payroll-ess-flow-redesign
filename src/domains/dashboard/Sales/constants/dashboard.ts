import chartsquareImg from '../assets/icons/chart-2.svg';
import companyDocumentsImg from '../assets/icons/dashboard/company-documents.svg';
import documentImg from '../assets/icons/dashboard/document.svg';
import orderImg from '../assets/icons/dashboard/order.svg';
import payslipImg from '../assets/icons/dashboard/payslip.svg';
import reportsImg from '../assets/icons/dashboard/reports.svg';
import salaryImg from '../assets/icons/dashboard/salary.svg';
import emptyWalletImg from '../assets/icons/empty-wallet.svg';
import moneySendImg from '../assets/icons/money-send.svg';
import receipt2Img from '../assets/icons/receipt-2.svg';
import receiptItemImg from '../assets/icons/receipt-item.svg';
import statusUpImg from '../assets/icons/status-up.svg';

export const STAT_CARDS_CONFIG = [
    { id: 'total-customers', label: 'Leads / Customers', bgColor: '#FDF6F0', icon: statusUpImg },
    { id: 'total-quotations', label: 'Quotations', bgColor: '#ECF0FC', icon: emptyWalletImg },
    { id: 'total-agreements', label: 'Agreements', bgColor: '#EBF6F1', icon: receiptItemImg },
    { id: 'sales-order', label: 'Sales Order', bgColor: '#FCF9FF', icon: chartsquareImg },
    { id: 'payments', label: 'Payments', bgColor: '#F3F1FF', icon: moneySendImg },
    { id: 'total-invoices', label: 'Invoices', bgColor: '#FFF1FE', icon: receipt2Img },
] as const;

export const QUICK_ACCESS_CONFIG = [
    { id: 'total-customers', label: 'Customer / Leads', icon: documentImg },
    { id: 'total-quotations', label: 'Quotation', icon: reportsImg },
    { id: 'total-agreements', label: 'Agreement', icon: companyDocumentsImg },
    { id: 'sales-order', label: 'Sales Order', icon: orderImg },
    { id: 'invoices', label: 'Invoice', icon: payslipImg },
    { id: 'payments', label: 'Payment', icon: salaryImg },
] as const;
