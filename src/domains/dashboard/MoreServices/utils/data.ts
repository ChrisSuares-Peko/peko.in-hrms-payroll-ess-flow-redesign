import BusinessDocs from '@domains/dashboard/MoreServices/assets/icons/BusinessDocs.svg';
import ZeroCarbon from '@domains/dashboard/MoreServices/assets/icons/Co2.svg';
import Accounting from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Accounting.svg';
// import BusTickets from '@domains/dashboard/MoreServices/assets/icons/comingSoon/BusTickets.svg';
import CarRentals from '@domains/dashboard/MoreServices/assets/icons/comingSoon/CarRentals.svg'
import CorporateCards from '@domains/dashboard/MoreServices/assets/icons/comingSoon/CorporateCards.svg'
import GovernmentServices from '@domains/dashboard/MoreServices/assets/icons/comingSoon/GovernmentServices.svg';
import Insurance from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Insurance.svg';
import Invoicing from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Invoicing.svg';
import LegalServices from '@domains/dashboard/MoreServices/assets/icons/comingSoon/LegalServices.svg';
import Marketplace from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Marketplace.svg';
import CurrencyBankAccount from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Multi-CurrencyBankAccount.svg';
import PaymentLinksNew from '@domains/dashboard/MoreServices/assets/icons/comingSoon/PaymentLinks.svg';
import Payouts from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Payouts.svg';
import PekoCommerce from '@domains/dashboard/MoreServices/assets/icons/comingSoon/PekoCommerce.svg';
import PekoFlow from '@domains/dashboard/MoreServices/assets/icons/comingSoon/PekoFlow.svg'
import Procure from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Procure.svg';
// import Sales from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Sales.svg'
import SoftwaresSubscriptions from '@domains/dashboard/MoreServices/assets/icons/comingSoon/SoftwaresSubscriptions.svg';
import Tax from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Tax.svg';
// import VerificationSuite from '@domains/dashboard/MoreServices/assets/icons/comingSoon/VerificationSuite.svg'
import Visa from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Visa.svg'
import Works from '@domains/dashboard/MoreServices/assets/icons/comingSoon/Works.svg';
// import Connect from '@domains/dashboard/MoreServices/assets/icons/Connect.svg';
// import CorporateCards from '@domains/dashboard/MoreServices/assets/icons/CorporateCards.svg';
import EmailDomain from '@domains/dashboard/MoreServices/assets/icons/EmailDomain.svg';
import ESign from '@domains/dashboard/MoreServices/assets/icons/ESign.svg';
// import GiftCardsIcon from '@domains/dashboard/MoreServices/assets/icons/GiftCards.svg';
import GovService from '@domains/dashboard/MoreServices/assets/icons/govservice.svg';
// import Invoicing from '@domains/dashboard/MoreServices/assets/icons/Invoicing.svg';
import LicenceRegistration from '@domains/dashboard/MoreServices/assets/icons/LicenceRegistration.svg';
import CompanyIncorporation from '@domains/dashboard/MoreServices/assets/icons/moreServices/CompanyIncorporation.svg';
import Compliances from '@domains/dashboard/MoreServices/assets/icons/moreServices/Compliances.svg';
// import NeedHelp from '@domains/dashboard/MoreServices/assets/icons/NeedHelp.svg';
import DomainAndHosting from '@domains/dashboard/MoreServices/assets/icons/moreServices/DomainAndHosting.svg'
// import eSign from '@domains/dashboard/MoreServices/assets/icons/moreServices/eSign.svg'
// import Logistics from '@domains/dashboard/MoreServices/assets/icons/moreServices/Logistics.svg'
import GBS from '@domains/dashboard/MoreServices/assets/icons/moreServices/gbs.svg';
// import Turbo from '@domains/dashboard/MoreServices/assets/icons/moreServices/Turbo.svg'
// import WhatsAppForBusiness from '@domains/dashboard/MoreServices/assets/icons/moreServices/WhatsAppForBusiness.svg'
import OfficeSpace from '@domains/dashboard/MoreServices/assets/icons/OfficeSpace.svg';
import PaymentLinks from '@domains/dashboard/MoreServices/assets/icons/PaymentLinks.svg';
// import Pekocloud from '@domains/dashboard/MoreServices/assets/icons/pekocloud.svg';
// import Reports from '@domains/dashboard/MoreServices/assets/icons/Reports.svg';
// import TurboIcon from '@domains/dashboard/MoreServices/assets/icons/Turbo.svg';
// import WhatsAppForBusinessIcon from '@domains/dashboard/MoreServices/assets/icons/WhatsappForBusiness.svg';
import WorkingCapital from '@domains/dashboard/MoreServices/assets/icons/WorkingCapital.svg';
// import Works from '@domains/dashboard/MoreServices/assets/icons/Works.svg';
import { paths } from '@src/routes/paths';

export const moreServicess = [
    {
        icon: GovService,
        title: 'Government Services',
        status: 'New',
        path: paths.dashboard.governmentServices,
    },
    {
        icon: OfficeSpace,
        title: 'Office Address',
        status: '',
        path: `/${paths.dashboard.officeAddress}`,
    },
    {
        icon: Works,
        title: 'Works',
        status: '',
        path: `/${paths.dashboard.works}`,
    },
    {
        icon: ZeroCarbon,
        title: 'Zero Carbon',
        status: 'New',
        path: `/${paths.dashboard.zeroCarbon}`,
    },
    {
        icon: BusinessDocs,
        title: 'Business Docs',
        status: '',
        path: paths.dashboard.businessDocs,
    },

    {
        icon: ESign,
        title: 'eSign',
        status: '',
        path: `/${paths.dashboard.eSign}`,
    },
    {
        icon: WorkingCapital,
        title: 'Connect',
        status: '',
        path: `${paths.dashboard.pekoConnect}`,
    },
    {
        icon: LicenceRegistration,
        title: 'Hike',
        status: 'New',
        path: `/${paths.dashboard.hike}`,
    },

    {
        icon: EmailDomain,
        title: 'Business Emails',
        status: 'New',
        path: `/${paths.dashboard.emailDomain}`,
    },
    {
        icon: PaymentLinks,
        title: 'Payment Links',
        status: '',
        path: paths.dashboard.paymentLinks,
    },
    // {
    //     icon: VerificationServices,
    //     title: 'Verification Suite',
    //     status: 'New',
    //     path: `/${paths.dashboard.verificationSuite}`,
    // },
];

export const moreServices = [
    {
        icon: GovService,
        title: 'Government Services',
        status: '',
        path: paths.dashboard.governmentServices,
    },
    // {
    //     icon: WhatsAppForBusiness,
    //     title: 'WhatsApp for Business',
    //     status: '',
    //     path: paths.dashboard.whatsappForBusiness,
    // },
    {
        icon: Works,
        title: 'Works',
        status: '',
        path: paths.dashboard.whatsappForBusiness,
    },
    // {
    //     icon: eSign,
    //     title: 'eSign',
    //     status: '',
    //     path: paths.dashboard.eSign,
    // },
    // {
    //     icon: Turbo,
    //     title: 'Turbo',
    //     status: '',
    //     path: paths.dashboard.turbo,
    // },
    {
        // TODO: swap to a dedicated Business Registration icon when available
        icon: CompanyIncorporation,
        title: 'Business Registration',
        status: 'New',
        path: paths.dashboard.businessRegistration,
    },
    {
        icon: GBS,
        title: 'Global Business Setup',
        status: 'New',
        path: paths.dashboard.globalBusinessSetup,
    },
    {
        icon: DomainAndHosting,
        title: 'Domain & Hosting',
        status: '',
        path: paths.dashboard.domainHosting,
    },
    // {
    //     icon: Logistics,
    //     title: 'Logistics',
    //     status: '',
    //     path: paths.dashboard.logistics,
    // },
    {
        icon: LegalServices,
        title: 'Legal Service',
        status: 'New',
        path: paths.dashboard.legalService,
    },
    {
        icon: Compliances,
        title: 'Compliances',
        status: '',
        path: paths.dashboard.compliance,
    },
     {
        icon: SoftwaresSubscriptions,
        title: 'Softwares Subscriptions',
        status: '',
        path: '#',
    },
    {
        icon: PekoCommerce,
        title: 'Peko Commerce',
        status: '',
        path: '#',
    },
    {
        icon: Marketplace,
        title: 'Marketplace',
        status: '',
        path: '#',
    },
    {
        icon: CurrencyBankAccount,
        title: 'Multicurrency Business Account',
        status: '',
        path: '#',
    },
    {
        icon: Insurance,
        title: 'Insurance',
        status: '',
        path: '#',
    },
    {
        icon: GBS,
        title: 'Global Business Setup',
        status: 'New',
        path: paths.dashboard.globalBusinessSetup,
    },
    {
        icon: PekoFlow,
        title: 'Peko Flow',
        status: '',
        path: '#',
    },
    {
        icon: CarRentals,
        title: 'Car Rentals',
        status: '',
        path: '#',
    },
    // {
    //     icon: Tax,
    //     title: 'Tax & more',
    //     status: '',
    //     path: paths.dashboard.taxMore,
    // },
];


export const ComingSoon = [
    {
        icon: Marketplace,
        title: 'Marketplace',
        status: '',
        path: '#',
    },
    {
        icon: Tax,
        title: 'Tax & more',
        status: '',
        path: '#',
    },
    {
        icon: Accounting,
        title: 'Accounting',
        status: '',
        path: '#',
    },
    //        {
    //     icon: VerificationSuite,
    //     title: 'Verification Suite',
    //     status: '',
    //     path: '#',
    // },

    {
        icon: CorporateCards,
        title: 'Corporate Cards',
        status: '',
        path: '#',
    },
    {
        icon: Visa,
        title: 'Visa',
        status: '',
        path: '#',
    },
    {
        icon: GovernmentServices,
        title: 'Government Services',
        status: '',
        path: '#',
    },
    // {
    //     icon: LegalServices,
    //     title: 'Legal Service',
    //     status: 'New',
    //     path: '#',
    // },
    {
        icon: Works,
        title: 'Works',
        status: '',
        path: '#',
    },
    {
        icon: CurrencyBankAccount,
        title: 'Multi-Currency Bank Account',
        status: '',
        path: '#',
    },
    {
        icon: Insurance,
        title: 'Insurance',
        status: '',
        path: '#',
    },
    {
        icon: SoftwaresSubscriptions,
        title: 'Softwares',
        status: '',
        path: '#',
    },
    {
        icon: PekoFlow,
        title: 'Peko Flow',
        status: '',
        path: '#',
    },
    {
        icon: CarRentals,
        title: 'Car Rentals',
        status: '',
        path: '#',
    },
    {
        icon: Invoicing,
        title: 'Invoicing',
        status: '',
        path: '#',
    },
    //  {
    //     icon: Sales,
    //     title: 'SalesX',
    //     status: '',
    //     path: '#',
    // },
    {
        icon: Payouts,
        title: 'Payouts',
        status: '',
        path: '#',
    },

    {
        icon: PaymentLinksNew,
        title: 'Payment Links',
        status: '',
        path: '#',
    },
    {
        icon: Procure,
        title: 'Procure',
        status: '',
        path: '#',
    },
];

export const extraServicesForMobile = [
    // {
    //     path: paths.dashboard.whatsappForBusiness,
    //     title: 'WhatsApp for Business',
    //     status: '',
    //     icon: WhatsAppForBusinessIcon,
    // },
    // {
    //     path: paths.dashboard.turbo,
    //     title: 'Turbo',
    //     status: '',
    //     icon: TurboIcon,
    // },
    // {
    //     path: paths.dashboard.connect,
    //     title: 'Marketplace',
    //     status: 'New',
    //     icon: Connect,
    // },
    // {
    //     path: paths.dashboard.giftCards,
    //     title: 'Gift Cards',
    //     status: '',
    //     icon: GiftCardsIcon,
    // },
    // {
    //     path: paths.dashboard.pekoCloud,
    //     title: 'Hub',
    //     status: '',
    //     icon: Pekocloud,
    // },
    // {
    //     path: paths.dashboard.reports,
    //     title: 'Reports',
    //     status: '',
    //     icon: Reports,
    // },
    // {
    //     path: paths.dashboard.needHelp,
    //     title: 'Need Help',
    //     status: '',
    //     icon: NeedHelp,
    // },
    // {
    //     path: '#',
    //     title: 'Accounting & Tax',
    //     status: 'New',
    //     icon: Accounting,
    // },
    // {
    //     path: paths.dashboard.works,
    //     title: 'Works',
    //     status: 'New',
    //     icon: Works,
    // },
    // {
    //     path: paths.dashboard.invoicing,
    //     title: 'Invoicing',
    //     status: 'Free',
    //     icon: Invoicing,
    // },
    // {
    //     path: paths.dashboard.paytmBpos,
    //     title: 'Paytm BPOS',
    //     status: 'New',
    //     icon: PaytmBPOS,
    // },
    // {
    //     path: '#',
    //     title: 'Insurance',
    //     status: 'New',
    //     icon: Insurance,
    // },
    // {
    //     path: '#',
    //     title: 'Vendor payout',
    //     status: '',
    //     icon: Payout,
    // }
];
