import collabApproval from '@domains/dashboard/eSign/assets/collabApproval.png';
import eSignApproval from '@domains/dashboard/eSign/assets/eSignApproval.png';
import eSignDoc from '@domains/dashboard/eSign/assets/eSignDoc.png';
import eSignInstant from '@domains/dashboard/eSign/assets/eSignInstant.png';
import instantEsign from '@domains/dashboard/eSign/assets/instantEsign.png';
import eSignSecure from '@domains/dashboard/eSign/assets/SecureandCompliant.png';
import secureEsign from '@domains/dashboard/eSign/assets/secureEsign.png';
import streamlineDoc from '@domains/dashboard/eSign/assets/streamlineDoc.png';
import { paths } from '@src/routes/paths';

export const eSignFeatures = [
    {
        icon: eSignInstant,
        iconMob: instantEsign,
        title: 'Instant eSigns',
        description: 'Quickly send, sign, and approve documents from anywhere.',
        link: `${paths.invoice.create}`,
    },
    {
        icon: eSignDoc,
        iconMob: streamlineDoc,
        title: 'Streamline Documents',
        description: 'Organize and store all your signed documents at one place.',
        link: `${paths.invoice.paymentLinks}`,
    },
    {
        icon: eSignApproval,
        iconMob: collabApproval,
        title: 'Collaborative Approval',
        description: 'Share documents with teams and clients, allowing for collaborative approvals',
        link: `${paths.invoice.invoicehistory}`,
    },
    {
        icon: eSignSecure,
        iconMob: secureEsign,
        title: 'Secure and Compliant',
        description: 'Protect sensitive information with industry-leading encryption.',
        link: `${paths.invoice.guidelines}`,
    },
];

export const serviceDetails =
    'Manage documents from start to finish with our all-in-one e-signature and document storage platform. Send, sign, and approve documents instantly, reducing delays with secure, legally binding e-signatures. Organize files in a centralized system that provides easy access and real-time tracking for each document’s status. Collaborate seamlessly by sharing documents for team edits and approvals, keeping everyone on the same page. With advanced security and compliance, protect sensitive information and ensure confidentiality at every step. Simplify your document workflows and empower your team to work faster and smarter, all in one streamlined platform.';
export const subDescription =
    'Digitally sign, manage, and organize your documents all in one place';
