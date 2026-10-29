import IconAccounts from '@assets/icons/Accounts.svg';
import IconBillPayments from '@assets/icons/BillPayments.svg';
import IconCart from '@assets/icons/Cart.svg';
import IconConnect from '@assets/icons/Connect.svg';
import IconCorporateCard from '@assets/icons/CorporateCard.svg';
import IconDashboard from '@assets/icons/Dashboard.svg';
import IconESign from '@assets/icons/ESign.svg';
import IconEarnings from '@assets/icons/Earnings.svg';
import IconGiftCards from '@assets/icons/GiftCards.svg';
import IconHandshake from '@assets/icons/Handshake.svg';
import IconHelp from '@assets/icons/Help.svg';
import IconInsurance from '@assets/icons/Insurance.svg';
import IconInvoicing from '@assets/icons/Invoicing.svg';
import IconLogistics from '@assets/icons/Logistics.svg';
import IconManage from '@assets/icons/Manage.svg';
import IconMobileRecharge from '@assets/icons/MobileRecharge.svg';
import IconNotebook from '@assets/icons/Notebook.svg';
import IconNotification from '@assets/icons/Notification.svg';
import IconPackage from '@assets/icons/Package.svg';
import IconPaymentLink from '@assets/icons/PaymentLink.svg';
import IconPayroll from '@assets/icons/Payroll.svg';
import IconPerks from '@assets/icons/Perks.svg';
import IconProcureIcon from '@assets/icons/ProcureIcon.svg';
import IconReports from '@assets/icons/Reports.svg';
import IconSecureWebmail from '@assets/icons/Secure Webmail.svg';
import IconSettings from '@assets/icons/Settings.svg';
import IconSupplies from '@assets/icons/Supplies.svg';
import IconTax from '@assets/icons/Tax.svg';
import IconTravel from '@assets/icons/Travel.svg';
import IconTurbo from '@assets/icons/Turbo.svg';
import IconVendorPayouts from '@assets/icons/VendorPayouts.svg';
import IconVerificationSuite from '@assets/icons/VerificationSuite.svg';
import IconVerified from '@assets/icons/Verified.svg';
import IconWhatsAppForBusiness from '@assets/icons/WhatsAppForBusiness.svg';
import IconWorks from '@assets/icons/Works.svg';
import IconZeroCarbon from '@assets/icons/ZeroCarbon.svg';
import IconBpIcon from '@assets/icons/bpIcon.svg';
import IconBuilding from '@assets/icons/building.svg';

import { Permission } from '../types/partnerPermission';

/**
 * TEMPORARY static mock of the `user/services/partner-initial-sidebar` response,
 * used while the backend flattening is not yet implemented.
 *
 * Difference from the current API shape: the `"More Services"` wrapper node is
 * removed and its sub-services are promoted to **top-level** entries (each marked
 * `enableMoreService: true`). Every service also carries an `icon` (served from a
 * static CDN) and an explicit `enableMoreService` flag (defaults to `false`).
 * Remove this file and switch back to `useUpdateRoles().permissionData` once the
 * backend returns the flattened shape.
 */
// PROTOTYPE-SETUP: service icons now come from local assets (src/assets/icons) instead of cdn.peko.one.

export const staticPartnerPermissions: Permission[] = [
    {
        label: 'Dashboard',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconDashboard,
    },
    {
        label: 'Mobile Recharge & Bills',
        hasAccess: false,
        enableMoreService: false,
        icon: IconMobileRecharge,
        subServices: [
            { label: 'Prepaid', hasAccess: false },
            { label: 'Postpaid', hasAccess: false },
            { label: 'Test', hasAccess: false },
        ],
    },
    {
        label: 'Utility Payments',
        hasAccess: false,
        enableMoreService: false,
        icon: IconBillPayments,
        subServices: [
            { label: 'Electricity Bill', hasAccess: false },
            { label: 'Broadband Bill', hasAccess: false },
            { label: 'LPG Cylinder', hasAccess: false },
            { label: 'Water Bill', hasAccess: false },
            { label: 'Landline Bill', hasAccess: false },
            { label: 'Piped Gas', hasAccess: false },
            { label: 'Education Fee', hasAccess: false },
            { label: 'Insurance', hasAccess: false },
            { label: 'Cable Recharge', hasAccess: false },
            { label: 'DTH Recharge', hasAccess: false },
            { label: 'FASTag Recharge', hasAccess: false },
            { label: 'Traffic Challan', hasAccess: false },
            { label: 'Clubs & Associations', hasAccess: false },
            { label: 'Hospital & Pathology', hasAccess: false },
            { label: 'Subscription', hasAccess: false },
            { label: 'NCMC', hasAccess: false },
            { label: 'NPS', hasAccess: false },
            { label: 'Prepaid Meter', hasAccess: false },
            { label: 'Life Insurance', hasAccess: false },
            { label: 'Bike Insurance', hasAccess: false },
            { label: 'Car Insurance', hasAccess: false },
            { label: 'Credit Card Payment', hasAccess: false },
            { label: 'Loan Repayment', hasAccess: false },
            { label: 'Municipal Taxes', hasAccess: false },
            { label: 'Municipal Services', hasAccess: false },
            { label: 'Recurring Deposite', hasAccess: false },
            { label: 'Rental', hasAccess: false },
            { label: 'Donations', hasAccess: false },
            { label: 'Housing Society', hasAccess: false },
            { label: 'Complaint Registration', hasAccess: false },
        ],
    },
    {
        label: 'Corporate Travel',
        hasAccess: false,
        enableMoreService: false,
        icon: IconTravel,
        subServices: [
            { label: 'airline', hasAccess: false },
            { label: 'hotels', hasAccess: false },
            { label: 'eSIM', hasAccess: false },
        ],
    },
    {
        label: 'Payroll',
        accessKey: 'peko_payroll',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconPayroll,
    },
    {
        label: 'Office Supplies',
        accessKey: 'ecommerce',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconSupplies,
    },
    {
        label: 'Domain & Hosting',
        accessKey: 'domain_and_hosting',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconManage,
    },
    {
        label: 'Turbo',
        accessKey: 'peko_garage',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconTurbo,
    },
    {
        label: 'eSign',
        accessKey: 'signDrive_eSign',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconESign,
    },
    {
        label: 'Verification Suite',
        accessKey: 'verification_suite',
        hasAccess: false,
        enableMoreService: false,
        icon: IconVerificationSuite,
        subServices: [
            { label: 'PAN Verification', hasAccess: false },
            { label: 'Aadhaar OKYC Verification', hasAccess: false },
            { label: 'Bank Account Verification', hasAccess: false },
            { label: 'GST Return Compliance Check', hasAccess: false },
            { label: 'GSTIN Verification', hasAccess: false },
            { label: 'Fetch GSTIN from PAN', hasAccess: false },
            { label: 'GST Business Verification', hasAccess: false },
            { label: 'Corporate Entity Verification', hasAccess: false },
            { label: 'Director Verification (CIN-based)', hasAccess: false },
            { label: 'Director Verification (DIN-based)', hasAccess: false },
        ],
    },
    {
        label: 'Peko Wallet',
        accessKey: 'peko_wallet',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconAccounts,
    },
    {
        label: 'Business Registration',
        accessKey: 'business_registration',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconBuilding,
    },
    {
        label: 'Global Business Setup',
        accessKey: 'global_business_setup',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconHandshake,
    },
    {
        label: 'Compliance',
        accessKey: 'compliance',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconVerified,
    },
    {
        label: 'Procure',
        accessKey: 'procure',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconProcureIcon,
    },
    {
        label: 'Payouts',
        accessKey: 'vendor_payouts',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconVendorPayouts,
    },
    {
        label: 'Payment Links',
        accessKey: 'quick_links',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconPaymentLink,
    },
    {
        label: 'Document Attestation',
        accessKey: 'document_attestation',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconNotebook,
    },
    {
        label: 'Business Docs',
        accessKey: 'edocs',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconNotebook,
    },
    {
        label: 'Office Address',
        accessKey: 'workspace',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconBuilding,
    },
    {
        label: 'Soundbox',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconNotification,
    },
    {
        label: 'Paytm BPOS',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconBpIcon,
    },
    {
        label: 'License Renewal',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconVerified,
    },
    {
        label: 'Works',
        accessKey: 'peko_works',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconWorks,
    },
    {
        label: 'Zero Carbon',
        accessKey: 'carbon_footprint',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconZeroCarbon,
    },
    {
        label: 'Connect',
        accessKey: 'peko_connect',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconConnect,
    },
    {
        label: 'ESR',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconReports,
    },
    {
        label: 'Hike',
        accessKey: 'hike_service',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconPerks,
    },
    {
        label: 'Business Emails',
        accessKey: 'email_domain_service',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconSecureWebmail,
    },
    {
        label: 'Government Services',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconBuilding,
    },
    {
        label: 'Logistics',
        accessKey: 'shipment_services',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconLogistics,
    },
    {
        label: 'Legal Service',
        accessKey: 'legal_service',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconHandshake,
    },
    {
        label: 'Peko POS',
        accessKey: 'peko_pos',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconCart,
    },
    {
        label: 'Softwares',
        accessKey: 'subscription_payments',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconPackage,
    },
    {
        label: 'Gift Cards',
        accessKey: 'quickcilver',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconGiftCards,
    },
    {
        label: 'Marketplace',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconCart,
    },
    {
        label: 'Tax & More',
        hasAccess: false,
        enableMoreService: false,
        icon: IconTax,
        subServices: [
            { label: 'GST Filing', hasAccess: false },
            { label: 'TDS Filing', hasAccess: false },
        ],
    },
    {
        label: 'Invoicing',
        accessKey: 'invoices',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconInvoicing,
    },
    {
        label: 'Insurance',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconInsurance,
    },
    {
        label: 'WhatsApp for Business',
        accessKey: 'whatsApp_for_busines',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconWhatsAppForBusiness,
    },
    {
        label: 'Corporate Cards',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconCorporateCard,
    },
    {
        label: 'Accounting',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconAccounts,
    },
    {
        label: 'Hub',
        accessKey: 'pekoCloud',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconManage,
    },
    {
        label: 'Sales',
        accessKey: 'sales',
        hasAccess: false,
        subServices: [],
        enableMoreService: false,
        icon: IconEarnings,
    },
    {
        label: 'Reports',
        hasAccess: false,
        enableMoreService: false,
        icon: IconReports,
        subServices: [
            { label: 'Transactions', hasAccess: false },
            { label: 'Cashbacks', hasAccess: false },
            { label: 'Scheduling Reports', hasAccess: false },
            { label: 'Subscription Transactions', hasAccess: false },
        ],
    },
    {
        label: 'Need Help',
        hasAccess: false,
        enableMoreService: false,
        icon: IconHelp,
        subServices: [
            { label: 'Contact Us', hasAccess: false },
            { label: 'Tickets', hasAccess: false },
            { label: 'Frequently Asked Questions', hasAccess: false },
        ],
    },
    {
        label: 'Settings',
        hasAccess: false,
        enableMoreService: false,
        icon: IconSettings,
        subServices: [
            { label: 'User Management', hasAccess: false },
            { label: 'Billing & Saved Cards', hasAccess: false },
            { label: 'Subscription Plans', hasAccess: false },
            { label: 'Security', hasAccess: false },
            { label: 'Connected Apps', hasAccess: false },
        ],
    },
];

export default staticPartnerPermissions;
