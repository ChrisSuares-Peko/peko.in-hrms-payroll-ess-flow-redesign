import BookIcon from '../assets/icons/book-1.svg';
import CommercialIcon from '../assets/icons/commerial.svg';
import DocAltIcon from '../assets/icons/document-1.svg';
import EmploymentIcon from '../assets/icons/employe_contract.svg';
import NDAIcon from '../assets/icons/non-disclosure.svg';
import type { LegalTemplate, MyTemplate, RecentDocument } from '../types';


export const TEMPLATE_CATEGORIES = ['All', 'Business & Agreement', 'Employment', 'IP & Technology', 'Compliance & Policy', 'Finance'] as const;
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

export const LEGAL_TEMPLATES: LegalTemplate[] = [
    {
        id: '1',
        title: 'Non-Disclosure Agreement',
        description: 'Mutual or one-way confidentiality...',
        timeEstimate: '5–8 min',
        category: 'Business & Agreement',
    },
    {
        id: '2',
        title: 'Employment Contract',
        description: 'Full-time or part-time employment...',
        timeEstimate: '10–15 min',
        category: 'Employment',
    },
    {
        id: '3',
        title: 'Privacy Policy',
        description: 'DPDP Act 2023 and IT Act compliant...',
        timeEstimate: '8–12 min',
        category: 'Compliance & Policy',
    },
    {
        id: '4',
        title: 'Founders Agreement',
        description: 'Agreement between co-founders...',
        timeEstimate: '15–20 min',
        category: 'Business & Agreement',
    },
    {
        id: '5',
        title: 'Freelance / Consulting Contract',
        description: 'Service agreement for independent...',
        timeEstimate: '8–12 min',
        category: 'Business & Agreement',
    },
    {
        id: '6',
        title: 'Terms of Service',
        description: 'Service agreement for independent constructor and...',
        timeEstimate: '10–14 min',
        category: 'Compliance & Policy',
    },
    {
        id: '7',
        title: 'IP Assignment Agreement',
        description: 'Transfer of intellectual property rights, patents, cop...',
        timeEstimate: '15–20 min',
        category: 'IP & Technology',
    },
    {
        id: '8',
        title: 'Shareholder Agreement',
        description: 'Agreement governing rights & obligation of company...',
        timeEstimate: '10–14 min',
        category: 'Business & Agreement',
    },
    {
        id: '9',
        title: 'Vendor / Supplier Agreement',
        description: 'Master agreement for procurement of...',
        timeEstimate: '10–14 min',
        category: 'Business & Agreement',
    },
    {
        id: '10',
        title: 'Loan Agreement',
        description: 'Formal loan document between lender & borrower covering...',
        timeEstimate: '8–12 min',
        category: 'Finance',
    },
    {
        id: '11',
        title: 'SaaS Subscription Agreement',
        description: 'Software-as-a-Service agreement...',
        timeEstimate: '10–14 min',
        category: 'IP & Technology',
    },
    {
        id: '12',
        title: 'Commercial Rent Agreement',
        description: 'Lease agreement for commercial offic...',
        timeEstimate: '10–14 min',
        category: 'Business & Agreement',
    },
];

export const MY_TEMPLATES: MyTemplate[] = [
    { id: '1', title: 'Advisory letter', subTitle: '', iconSrc: BookIcon },
    { id: '2', title: 'Offer letter', subTitle: 'Employment contract', iconSrc: EmploymentIcon },
    { id: '3', title: 'Offer letter', subTitle: 'Employment contract', iconSrc: EmploymentIcon },
    { id: '4', title: 'Building agreement', subTitle: 'commercial rent agreement', iconSrc: CommercialIcon },
];

export const RECENT_DOCUMENTS: RecentDocument[] = [
    {
        id: '1',
        title: 'Employment — Priya Sharma ',
        subTitle: 'Employment Contract • 15 Feb 2024',
        date: '15 Feb 2024',
        status: 'Signed',
        iconSrc: EmploymentIcon,
    },
    {
        id: '2',
        title: 'NDA — Acme & Beta Solutions',
        subTitle: 'Non-Disclosure Agreement • 01 Mar 2024',
        date: '01 Mar 2024',
        status: 'Sent',
        iconSrc: NDAIcon,
    },
    {
        id: '3',
        title: 'Privacy Policy — ShopEasy',
        subTitle: 'Privacy Policy • 15 Feb 2024',
        date: '15 Feb 2024',
        status: 'Sent',
        iconSrc: DocAltIcon,
    },
    {
        id: '4',
        title: 'Offer letter',
        subTitle: '15 Feb 2024',
        date: '15 Feb 2024',
        status: 'Sent',
        iconSrc: DocAltIcon,
    },
    {
        id: '5',
        title: 'Founders Agreement — Draft',
        subTitle: 'Founders Agreement • 10 Apr 2024',
        date: '10 Apr 2024',
        status: 'Draft',
        iconSrc: EmploymentIcon,
    },
];

export const RECENT_DOC_TABS = ['All', 'Draft', 'Sent', 'Signed'] as const;
