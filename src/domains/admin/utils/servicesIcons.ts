/* eslint-disable object-shorthand */
import BEmail from '@domains/admin/assets/icons/Business-Email.svg';
import Common from '@domains/admin/assets/icons/Common.svg';
import EDocs from '@domains/admin/assets/icons/E-Docs.svg';
import ESim from '@domains/admin/assets/icons/E-Sim.svg';
import Giftcards from '@domains/admin/assets/icons/Giftcards.svg';
import Hike from '@domains/admin/assets/icons/Hike.svg';
import KYB from '@domains/admin/assets/icons/KYB.svg';
import OfficeAddress from '@domains/admin/assets/icons/Office-Address.svg';
import Payouts from '@domains/admin/assets/icons/Payouts.svg';
import Tax from '@domains/admin/assets/icons/Tax.svg';
import Works from '@domains/admin/assets/icons/Works.svg';
import { serviceCategoryNames } from '@utils/accessKeys';

type ServiceIconsType = {
    [category: string]: {
        [service: string]: any;
    };
};

const serviceIcons: ServiceIconsType = {
    Dashboard: {},
    Users: {
        'Corporate Users': Common,
        'Corporate Lookup': Common,
        'Corporate Card Lookup': Common,
        'System Users': Common,
        Roles: Common,
        'Pending Sign-ups': Common,
    },
    Accounts: {
        'Self Transfer': Common,
        'Transfer Funds': Common,
        'Create Transaction': Common,
        'Wallet Reports': Common,
        'Bulk Refund': Common,
    },
    'Need Help': {
        Tickets: Common,
        'SignUp Issues': Common,
    },
    Reports: {
        Subscriptions: Common,
        Vendors: Common,
        Corporate: Common,
        'Connection Requests': Common,
        'Workspace Orders': OfficeAddress,
        'Software Orders': Common,
        Orders: Common,
        eSIM: ESim,
        'Peko Works': Works,
        Attestations: Common,
        'Airline Cancellation': Common,
        'Airline Modification': Common,
        'Bus Tickets': Common,
        'Scheduling Reports': Common,
        'Payment Links': Common,
        'Transaction Report': Common,
    },
    'Office Supplies': {
        Products: Common,
        Orders: Common,
    },
    Announcements: {
        Notifications: Common,
    },
    Settings: {
        Vendors: Common,
        'Service Operators': Common,
        Packages: Common,
        Cashback: Common,
        'Subscription Codes': Common,
        'Disable Service': Common,
        Banners: Common,
        Categories: Common,
        'Referral Code': Common,
        Voucher: Common,
        'Partner Permissions': Common,
        'Coupon Code': Common,
        'Peko WhatsApp Numbers': Common,
        'Invoice Templates': Common,
        Branding: Common,
        'IP Whitelist': Common,
        'Accounting Approvals': Common,
        'Service Classification': Common,
        'Email Templates': Common,
    },
    Manage: {
        'Software Products': Common,
        'Software Plans': Common,
        'Office Address': OfficeAddress,
        Workspaces: OfficeAddress,
        'Corporate Tax Registration': Tax,
        'Peko Works': Works,
        'Work Plans': Works,
        'Gift Cards': Giftcards,
        'Legal Templates': Common,
        Connect: Common,
        'E-Docs': EDocs,
        'Vendor Payout': Payouts,
        'Business Emails': BEmail,
        'Business Emails Plans': BEmail,
        'Domain & Hosting Plans': Common,
        'Car Report Plans': Common,
        'Domain TLDs': Common,
        Hike: Hike,
        'eSIM Plans': ESim,
        'Collector KYB': KYB,
        'KYB Verifications': KYB,
        'Business Registration': Common,
        'Payout Onboarding': Payouts,
        [serviceCategoryNames.utility]: Common,
    },
    Accounting: {
        'Order Journals': Common,
        'Service without plans': Common,
        'Service with plans': Common,
        'Peko Subscriptions': Common,
        'Whitelabel Partners': Common,
        'Chart of Accounts': Common,
        Vendors: Common,
        Subscribers: Common,
        Partners: Common,
        'Payment Gateways': Common,
        Approvals: Common,
        FAQ: Common,
    },
    Profile: {},
    'System Configuration': {
        'Password Policy': Common,
        'Password Protection': Common,
        'Application Policy': Common,
    },
    'Payment Links': {},
};

export default serviceIcons;
