import { combineReducers, configureStore } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-extraneous-dependencies
import configureMockStore from 'redux-mock-store';
import {
    FLUSH,
    PAUSE,
    PERSIST,
    PURGE,
    PersistedState,
    REGISTER,
    REHYDRATE,
    persistReducer,
    persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import bulkProductsReducer from '@domains/admin/manage/slices/bulkProducts';
import bulkUploadCommon from '@domains/admin/manage/slices/bulkUpload';
import { forgotpasswordReducer } from '@domains/auth/slices/forgotpasswordSlice';
import loginReducer, { MOCK_AUTHENTICATED_USER } from '@domains/auth/slices/loginSlice';
import passwordPolicyReducer from '@domains/auth/slices/passwordPolicySlice';
import registrationReducer from '@domains/auth/slices/registerSlice';
import airlinesFormReducer from '@domains/dashboard/Airline/slices/airlineSlice';
import busTicketReducer from '@domains/dashboard/BusTickets/slices/busTicketSlice';
import getHotelReducer from '@domains/dashboard/Hotels/slices/getHotelSlice';
import invoicesReducer from '@domains/dashboard/Invoice/slices/InvoicesSlices';
import invoiceBulkCustomerReducer from '@domains/dashboard/invoiceV2/slices/bulkCustomerSlice';
import eInvoiceAuthReducer from '@domains/dashboard/invoiceV2/slices/eInvoiceAuthSlice';
import eInvoiceIrnReducer from '@domains/dashboard/invoiceV2/slices/eInvoiceIrnSlice';
import logisticsReducer from '@domains/dashboard/logistics/slice/logisticsSlice';
import logisticsV3Reducer from '@domains/dashboard/logisticsNew/slice/logisticsSlice';
import supportReducer from '@domains/dashboard/needHelp/slices/supportSlice';
import planReducer from '@domains/dashboard/OfficeAddress/slices';
import cartReducer from '@domains/dashboard/officeSupplies/slices/cartSlice';
import paymentReducer from '@domains/dashboard/payments/slices/payment';
import addressReducer from '@domains/dashboard/profile/slices/address';
import bankReducer from '@domains/dashboard/profile/slices/bank';
import basicInfoReducer from '@domains/dashboard/profile/slices/basicInfo';
import companyInfoReducer from '@domains/dashboard/profile/slices/companyInfo';
import otpReducer from '@domains/dashboard/profile/slices/otpSlice';
import securityInfoReducer from '@domains/dashboard/profile/slices/securityInfo';
import subscriptionReducer from '@domains/dashboard/Subscriptions/slice/paymentSlice';
import whatsappBusinessReducer from '@domains/dashboard/WhatsappForBusiness/slices/paymentSlice';
import accountingReportFiltersReducer from '@src/domains/dashboard/accounting/slices/reportFiltersSlice';
import beneficiaryReducer from '@src/domains/dashboard/billPayments/slices/beneficiary';
import billPaymentReducer from '@src/domains/dashboard/billPayments/slices/billPaymentSlice';
import { businessRegistrationReducer } from '@src/domains/dashboard/BusinessRegistration/slices/businessRegistrationSlice';
import challanReducer from '@src/domains/dashboard/challan/slices/challanSlice';
import { incorporationReducer } from '@src/domains/dashboard/CompanyIncorporation/slices/incorporationSlice';
import complianceFormReducer from '@src/domains/dashboard/Compliance/slices/complianceFormSlice';
import corporateCardsReducer from '@src/domains/dashboard/corporateCards/slices/corporateCardsSlice';
import visaReducer from '@src/domains/dashboard/CorporateTravel/store/visaSlice';
import domainHostingReducer from '@src/domains/dashboard/Domain & Hosting/slices/domainHostingSlice';
import businessEmailReducer from '@src/domains/dashboard/emailDomain/slices/businessEmailSlice';
import eSignDocReducer from '@src/domains/dashboard/eSign/slices/eSignDocSlice';
import esimReducer from '@src/domains/dashboard/esim/slice/esimSlice';
import giftcardCheckoutReducer from '@src/domains/dashboard/GiftCards/slices/checkoutSlice';
import globalBusinessSetupReducer from '@src/domains/dashboard/globalBusinessSetup/slices/globalBusinessSetupSlice';
// eslint-disable-next-line import/no-cycle
import governmentServicesReducer from '@src/domains/dashboard/GovernmentServicesV2/slices';
import hikeReducer from '@src/domains/dashboard/Hike/slices/hikeSlice';
import addressDetailsReducer from '@src/domains/dashboard/officeSupplies/slices/addressSlice';
import orderDetailsReducer from '@src/domains/dashboard/officeSupplies/slices/orderDetailsSlice';
import ctcCalculatorDraftReducer from '@src/domains/dashboard/Payroll/slices/ctcCalculatorDraft';
import employeeDetailsReducer from '@src/domains/dashboard/Payroll/slices/employeeDetailsSlice';
import employeeSettingsReducer from '@src/domains/dashboard/Payroll/slices/employeeSettings';
import employeeReducer from '@src/domains/dashboard/Payroll/slices/employeeSlices';
import BulkEmployeeUploadReducer from '@src/domains/dashboard/Payroll/slices/jsonSlice';
import orgSettingsReducer from '@src/domains/dashboard/Payroll/slices/orgSettings';
import payrollAuthReducer, {
    payrollAuthInitialState,
} from '@src/domains/dashboard/Payroll/slices/payrollAuth';
import payrollSalaryReducer from '@src/domains/dashboard/Payroll/slices/payrollSalarySlice';
import pekoWalletReducer from '@src/domains/dashboard/pekoWallet/slice/WalletSlice';
import purchaseRequestDraftReducer from '@src/domains/dashboard/Procure/slices/purchaseRequestDraftSlice';
import rfqDraftReducer from '@src/domains/dashboard/Procure/slices/rfqDraftSlice';
import vendorDraftReducer from '@src/domains/dashboard/Procure/slices/vendorDraftSlice';
import salesBulkCustomerReducer from '@src/domains/dashboard/Sales/slices/bulkCustomerSlice';
import softwareReducer from '@src/domains/dashboard/softwares/slice/softwareSlice';
import taxMoreReducer from '@src/domains/dashboard/taxAndMore/slice/taxMoreSlice';
import beneficiaryPrepaidReducer from '@src/domains/dashboard/telecomPayments/slice/beneficiarySlice';
import PrepaidReducer from '@src/domains/dashboard/telecomPayments/slice/prepaidFormSlice';
import turboReducer from '@src/domains/dashboard/turbo/slices/turboSlice';
import vehicleReportReducer from '@src/domains/dashboard/vehicleReports/slices/vehicleReportSlice';
import verificationSuiteReducer from '@src/domains/dashboard/verificationSuite/slices/verificationSlice';
import workReducer from '@src/domains/dashboard/Works/slices/worksSlice';
import activeTabReducer from '@src/slices/activeTabSlice';
import callReducer from '@src/slices/callSlice';
import chatReducer from '@src/slices/chatSlice';
import loaderReducer from '@src/slices/loaderSlice';
import servicesReducer from '@src/slices/servicesSlice';
import subscriptionsReducer from '@src/slices/subscriptionSlice';
import userReducer from '@src/slices/userSlice';

import apiReducer from '../slices/apiSlice';

// One-time migration: move pre-existing airline state from persist:root → persist:airline,
// stripping bloated search-time keys so we don't carry the quota error forward.
// Runs once per browser; subsequent loads see persist:airline and skip this block.
(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (window.localStorage.getItem('persist:airline')) return;
    const rootRaw = window.localStorage.getItem('persist:root');
    if (!rootRaw) return;
    try {
        const rootParsed = JSON.parse(rootRaw);
        if (!rootParsed.airline) return;
        const airlineState = JSON.parse(rootParsed.airline);
        const exclude = new Set([
            'flightResponse',
            'inbountFlightResponse',
            'airlineData',
            'fairRulesData',
            'ancillariesSearch',
            'selectedAncillaries',
        ]);
        const airlinePersist: Record<string, string> = {};
        Object.keys(airlineState).forEach(k => {
            if (exclude.has(k)) return;
            airlinePersist[k] = JSON.stringify(airlineState[k]);
        });
        window.localStorage.setItem('persist:airline', JSON.stringify(airlinePersist));
    } catch {
        // fresh start is acceptable if migration fails
    }
})();

// PROTOTYPE-SETUP: auth (and payrollAuth) are persisted, so stale localStorage from an older run (or a real
// login) would silently replace the mock identity / seeded payroll setup. Force them back on every rehydration.
const migrate = (state: PersistedState) =>
    Promise.resolve(
        state
            ? ({
                  ...state,
                  auth: MOCK_AUTHENTICATED_USER,
                  payrollAuth: { ...payrollAuthInitialState },
              } as PersistedState)
            : state
    );

const persistConfig = {
    key: 'root',
    storage,
    migrate,
    whitelist: [
        'auth',
        'payment',
        'cart',
        'logistics',
        'subscription',
        'whatsappBusiness',
        'giftcardCheckout',
        'payrollAuth',
        'bulkProducts',
        'hotels',
        'eSignDoc',
        'esim',
        'freshChat',
        'activeTab',
        'businessEmail',
        'invoices',
        'call',
        'software',
        'visa',
        'eInvoiceAuth',
        'complianceForm',
        'purchaseRequestDraft',
        'rfqDraft',
        'vendorDraft',
        'busTicket',
    ],
};

const airlinePersistConfig = {
    key: 'airline',
    storage,
    blacklist: [
        'flightResponse',
        'inbountFlightResponse',
        'airlineData',
        'fairRulesData',
        'ancillariesSearch',
        'selectedAncillaries',
    ],
};

const rootReducer = combineReducers({
    registration: registrationReducer,
    forgotpassword: forgotpasswordReducer,
    invoices: invoicesReducer,
    eInvoiceAuth: eInvoiceAuthReducer,
    eInvoiceIrn: eInvoiceIrnReducer,
    invoiceBulkCustomer: invoiceBulkCustomerReducer,
    api: apiReducer,
    auth: loginReducer,
    logistics: logisticsReducer,
    logisticsV3: logisticsV3Reducer,
    cart: cartReducer,
    giftcardCheckout: giftcardCheckoutReducer,
    plan: planReducer,
    address: addressReducer,
    bank: bankReducer,
    basicInfo: basicInfoReducer,
    companyInfo: companyInfoReducer,
    subscription: subscriptionReducer,
    payment: paymentReducer,
    whatsappBusiness: whatsappBusinessReducer,
    orderDetails: orderDetailsReducer,
    otp: otpReducer,
    securityInfo: securityInfoReducer,
    user: userReducer,
    beneficiary: beneficiaryReducer,
    support: supportReducer,
    services: servicesReducer,
    airline: persistReducer(airlinePersistConfig, airlinesFormReducer),
    hotels: getHotelReducer,
    payrollAuth: payrollAuthReducer,
    orgSettings: orgSettingsReducer,
    ctcCalculatorDraft: ctcCalculatorDraftReducer,
    employee: employeeReducer,
    employeeSettings: employeeSettingsReducer,
    employeeDetails: employeeDetailsReducer,
    BulkUpload: BulkEmployeeUploadReducer,
    payrollSalary: payrollSalaryReducer,
    bulkProducts: bulkProductsReducer,
    bulkUploadData: bulkUploadCommon,
    esim: esimReducer,
    eSignDoc: eSignDocReducer,
    freshChat: chatReducer,
    loader: loaderReducer,
    subscriptions: subscriptionsReducer,
    works: workReducer,
    passwordPolicy: passwordPolicyReducer,
    businessEmail: businessEmailReducer,
    call: callReducer,
    hike: hikeReducer,
    pekoWallet: pekoWalletReducer,
    activeTab: activeTabReducer,
    benficiaryPrepaid: beneficiaryPrepaidReducer,
    Prepaid: PrepaidReducer,
    turbo: turboReducer,
    billPayments: billPaymentReducer,
    challan: challanReducer,
    busTicket: busTicketReducer,
    vehicleReport: vehicleReportReducer,
    verificationSuite: verificationSuiteReducer,
    governmentServices: governmentServicesReducer,
    domainHosting: domainHostingReducer,
    software: softwareReducer,
    visa: visaReducer,
    incorporation: incorporationReducer,
    accountingReportFilters: accountingReportFiltersReducer,
    complianceForm: complianceFormReducer,
    taxMore: taxMoreReducer,
    globalBusinessSetup: globalBusinessSetupReducer,
    addessDetails: addressDetailsReducer,
    businessRegistration: businessRegistrationReducer,
    purchaseRequestDraft: purchaseRequestDraftReducer,
    rfqDraft: rfqDraftReducer,
    vendorDraft: vendorDraftReducer,
    salesBulkCustomer: salesBulkCustomerReducer,
    corporateCards: corporateCardsReducer,
});

const reducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: {
        reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);

type RootReducerState = ReturnType<typeof rootReducer> & {
    _persist: { version: number; rehydrated: boolean };
};

export type RootState = {
    reducer: RootReducerState;
};
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export default store;

// Create the mock store
const mockStore = configureMockStore();
export const createTestStore = (initialState: Partial<RootState> = {}) =>
    mockStore(initialState as RootState);
