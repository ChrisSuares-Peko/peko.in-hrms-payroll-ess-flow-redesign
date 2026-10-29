import CreateInvoiceMob from '@domains/dashboard/Invoice/assets/create.png';
import CreateInvoiceIcon from '@domains/dashboard/Invoice/assets/createInvoice.png';
import createPayment from '@domains/dashboard/Invoice/assets/createPayment.png';
import createPaymentLinkMob from '@domains/dashboard/Invoice/assets/createPaymentLink.png';
import invoiceReminder from '@domains/dashboard/Invoice/assets/invoiceReminder.png';
import invoiceReminderMob from '@domains/dashboard/Invoice/assets/reminders.png';
import trackInvoiceMob from '@domains/dashboard/Invoice/assets/track.png';
import trackInvoice from '@domains/dashboard/Invoice/assets/trackInvoice.png';
import Feature1 from '@domains/dashboard/PekoCloud/assets/icons/feature1.svg';
import Feature2 from '@domains/dashboard/PekoCloud/assets/icons/feature2.svg';
import Feature3 from '@domains/dashboard/PekoCloud/assets/icons/feature3.svg';
import Feature4 from '@domains/dashboard/PekoCloud/assets/icons/feature4.svg';
import { paths } from '@src/routes/paths';

export const CollectorFeatures = [
    {
        icon: CreateInvoiceIcon,
        iconMob: CreateInvoiceMob,
        title: 'Create Invoice',
        description: 'Create and send invoices in seconds, fully customized to your brand.',
        link: `${paths.invoice.create}`,
    },
    {
        icon: createPayment,
        iconMob: createPaymentLinkMob,
        title: 'Create Payment Link',
        description: 'Generate secure, shareable payment links for instant, hassle-free payments.',
        link: '',
    },
    {
        icon: trackInvoice,
        iconMob: trackInvoiceMob,
        title: 'Track Invoices',
        description: 'Monitor payment status at a glance with real-time updates.',
        link: `${paths.invoice.invoicehistory}`,
    },
    {
        icon: invoiceReminder,
        iconMob: invoiceReminderMob,
        title: 'Reminders',
        description: 'Set automated reminders to reduce follow-up time and get paid on time.',
        link: `${paths.invoice.guidelines}`,
    },
];

export const featuresTheCollector = [
    {
        icon: Feature1,
        title: 'Invoice Generator',
        description: 'Simplify your invoicing process for precise and accurate billing.',
    },
    {
        icon: Feature2,
        title: 'Upload Invoice',
        description: 'Easily upload invoices in multiple formats for streamlined processing ',
    },
    {
        icon: Feature3,
        title: 'Payment Link',
        description: 'Organize and securely store essential business documents and assets.',
    },
    {
        icon: Feature4,
        title: 'Payment Reminders & Alerts',
        description: 'Set up reminders for schedules and deadlines.',
    },
];
export const serviceDetails =
    'Get rid of scattered tools, manual processes, and delayed payments with a platform that centralizes and automates every aspect of your accounts receivable. Streamline your cash flow with a centralized platform for all your accounts receivable needs. Generate branded invoices, add secure payment links, and automate reminders effortlessly. Track invoice status at a glance and view detailed cash flow insights, including outstanding balances and projections, all in one streamlined dashboard. Focus on growth while our platform handles the rest. ';
export const subDescription =
    'Trusted by thousands of businesses to manage millions in receivables seamlessly';
