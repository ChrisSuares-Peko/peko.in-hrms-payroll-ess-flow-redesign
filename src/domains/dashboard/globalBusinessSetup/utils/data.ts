import emptyBriefCase from '../assets/img/brief-case.png';
import file2 from '../assets/img/document.png';
import file from '../assets/img/file.png';
import handShake from '../assets/img/handShake2.png';
import officeDesk from '../assets/img/office-desk.png';
import officeOperator from '../assets/img/office-operator.png';
import Peko from '../assets/img/pekoSubscription.png';
import priceTag from '../assets/img/price-tag.png';
import registrationPaper from '../assets/img/registration-paper2.png';
import visa from '../assets/img/visa.png';

export const globalBusinessSetupFeatures = [
    {
        icon: registrationPaper,
        title: 'Company formation & licensing',
        description:
            'We help you choose the right company setup—mainland or free zone—for a smooth and compliant business launch.',
        // link: `${paths.invoice.create}`,
    },
    {
        icon: handShake,
        title: 'Company setup in days, not weeks',
        description:
            'Start your UAE company faster with our streamlined registration process and direct authority coordination.',
        // link: `${paths.invoice.paymentLinks}`,
    },
    {
        icon: visa,
        title: 'Residency & PRO services',
        description: 'Streamline your business setup with our reliable residency and PRO support. ',
        // link: `${paths.invoice.invoicehistory}`,
    },
    {
        icon: file,
        title: 'Documentation preparation & submission',
        description:
            'From visa applications to government paperwork, we handle it all efficiently, reliably, and without hassle.',
        // link: `${paths.invoice.guidelines}`,
    },
    {
        icon: officeOperator,
        title: 'Free expert consultation',
        description:
            'We prepare and submit all required documents while coordinating with the UAE authorities to fast-track approvals and avoid delays.',
        // link: `${paths.invoice.guidelines}`,
    },
    {
        icon: priceTag,
        title: 'No hidden charges',
        description:
            'Enjoy full transparency with an upfront cost breakdown. No forms, no sign-ups, no surprises.',
        // link: `${paths.invoice.guidelines}`,
    },
    {
        icon: emptyBriefCase,
        title: 'Free Peko+ subscription',
        description:
            'Get a free one-year Peko+ membership with exclusive benefits, support, and post-setup perks.',
        // link: `${paths.invoice.guidelines}`,
    },
    {
        icon: Peko,
        title: 'Simplified business setup',
        description:
            'We handle every step so you don’t have to, just pick your preferences and we take care of the rest.',
        // link: `${paths.invoice.guidelines}`,
    },
    {
        icon: file2,
        title: 'Flexible options to fit your needs',
        description:
            'Choose from a wide range of free zones and mainland setups, license types, visa packages, and office spaces.',
        // link: `${paths.invoice.guidelines}`,
    },
    {
        icon: officeDesk,
        title: 'Office space solutions',
        description:
            'Choose from virtual offices, flexi-desks, or serviced spaces. Fully compliant and tailored to your needs.',
        // link: `${paths.invoice.guidelines}`,
    },
];

export const globalBusinessSetupTitle =
    'Embark on your entrepreneurial journey with Global Business Setup, your dedicated partner in setting up a business in the UAE';

export const globalBusinessSetupSubDescription =
    "Setting up a business in the UAE can be complex, but with our expert-led setup service, it doesn’t have to be. We offer end-to-end support to help you establish your company seamlessly, whether you're launching in the mainland or a free zone. From choosing the right legal structure and securing your trade license to handling visa applications, bank account setup, and office space solutions, we take care of all the essentials, so you can focus on building your business. With our direct connections to government authorities and local banks, we streamline every step, ensuring compliance and saving you time, effort, and unnecessary costs.";

export const STATUS_COLOR_MAP: Record<
    string,
    {
        text: string;
        background: string;
        border: string;
        badgeStatus: 'default' | 'success' | 'error' | 'warning';
    }
> = {
    DRAFT: {
        text: '#64748b',
        background: '#f1f5f9',
        border: '#cbd5e1',
        badgeStatus: 'default',
    },
    SAVED: {
        text: '#1e40af',
        background: '#dbeafe',
        border: '#93c5fd',
        badgeStatus: 'default',
    },
    SUBMITTED: {
        text: '#ea580c',
        background: '#ffedd5',
        border: '#fdba74',
        badgeStatus: 'warning',
    },
    ASSIGNED: {
        text: '#7c3aed',
        background: '#ede9fe',
        border: '#c4b5fd',
        badgeStatus: 'default',
    },
    REJECTED: {
        text: '#b91c1c',
        background: '#fee2e2',
        border: '#fca5a5',
        badgeStatus: 'error',
    },
    CLOSED: {
        text: '#15803d',
        background: '#dcfce7',
        border: '#86efac',
        badgeStatus: 'success',
    },
};

export const findColorByStatus = (status?: string) => {
    const key = status?.toUpperCase() || 'DRAFT';
    return STATUS_COLOR_MAP[key] ?? STATUS_COLOR_MAP.DRAFT;
};
