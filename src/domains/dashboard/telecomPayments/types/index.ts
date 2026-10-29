import { FormikProps } from 'formik';

import { BillerPaymentChannelInfo } from '@customtypes/general';

export type CommonPayload = {
    userId: number;
    userType: string;
};

export type NumberDetailsPayload = CommonPayload & {
    number: string;
};

export type validateRechargePayload = CommonPayload & {
    serviceProvider: string;
    mobileNo: string;
    amount: string;
};

export interface ValidationResponse {
    StatusCode: string;
    Status?: string;
}

export type PrepaidPlansPayload = CommonPayload & {
    serviceProvider: string;
    location: string;
    // Required by the 121 vendor (Vi/Airtel); ignored for other providers.
    mobileNumber?: string;
};

export type MobilePlan = {
    Amount: number;
    Description: string;
    LocationName: string;
    PlanName: string;
    ServiceId: number;
    ServiceProviderId: number;
    ServiceProviderName: string;
    Talktime: number;
    Validity: string;
    // Only present for 121-vendor (Vi/Airtel) plans; needed when recharging those plans.
    planId?: string;
    billerId?: string;
};

export type PrepaidPlansResponse = {
    plans: MobilePlan[];
    planCategory: string[];
};

export type PrepaidPaymentPayload = CommonPayload & {
    accessKey: string;
    account: string;
    amount: number;
    location: string;
    serviceProvider: string;
    authKey: string;
};

export type GetServiceProvidersPayload = CommonPayload & {
    categoryName: string;
    searchText?: string;
};

export type CustomerValuesType = {
    paramName?: string;
    paramValue?: string;
    name?: string;
    value?: string;
};

export type FetchBillPayload = CommonPayload & {
    billerId: string;
    customerParams: CustomerValuesType[];
};

export enum billAmountType {
    exact = 'Exact',
    any = 'Any',
    above = 'Exact and above',
    below = 'Exact and below',
}

export type FetchBillResponse = {
    billAmount: string;
    billDate: string;
    billNumber: string;
    billPeriod: string;
    customerName: string;
    dueDate: string;
    requestId: string;
    exactness: string;
    additionalInfo: any;
};
export type PostpaidPaymentPayload = CommonPayload & {
    mobile: string;
    accessKey: string;
    refId: string;
    billerRefId: string;
    amount: string;
};

export type CustomerParam = {
    dataType: string;
    maxLength: number;
    minLength: number;
    isOptional: string;
    paramName: string;
    regex: string;
    values: string | null;
    visibility: boolean;
};

export type ParamInfo = {
    paramName: string;
    dataType: string;
    isOptional: boolean;
    minLength: number;
    maxLength: number;
    regEx: string;
    visibility: boolean;
};

export type BillerInputParams = {
    paramInfo: ParamInfo;
};

export interface biller {
    categoryName: string;
    categoryImage: string;
    billerName: string;
    billerId: string;
    country: string;
    coverage: string;
    billerInputParams: BillerInputParams[];
    customerParamsGroups: [];
    exactness: string;
    payWithoutFetchAllowed: boolean;
    billerFetchRequiremet?: string;
    billerFetchRequirement?: string;
    billerSupportBillValidation?: string;
    billerAdhoc?: string;
}

export type ServiceProviderResponse = {
    billersArray: biller[];
};

export type OptionsType = {
    value: string;
    label: string;
    customerParams: CustomerParam[] | [];
    billerFetchRequiremet?: string;
    billerFetchRequirement?: string;
    billerSupportBillValidation?: string;
    billerAdhoc?: string;
    billerPaymentChannels?: {
        paymentChannelInfo?: BillerPaymentChannelInfo | BillerPaymentChannelInfo[];
    };
};

export type StateListResponse = {
    states: OptionsType[];
};

export type MobileRechargeProvider = {
    id: number;
    providerName: string;
    displayName: string;
};

export type MobileRechargeProvidersResponse = MobileRechargeProvider[];

export interface BeneficiariesListProps {
    accessKeyName?: string;
}

export type ServiceBeneficiaryPayload = CommonPayload & {
    accessKey?: string;
};

export type Beneficiary = {
    id: number;
    accessKey: string;
    name: string;
    phoneNo: string;
    serviceProvider: string;
    billerId: string | null;
    providerCircle: string;
    isActive: boolean;
    customerParams: CustomerValuesType[];
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    serviceOperator: {
        serviceProvider: string;
        serviceImage: string;
    };
};

export type BeneficiariesResponse = {
    beneficiaries: Beneficiary[];
};

export type addEditBeneficiaryPayload = CommonPayload & {
    id?: number;
    name?: string;
    accountNo?: string;
    accessKey?: string;
    isActive: string;
    credentialId: string;
    otp?: string;
    scope?: string;
};

export type SendOtpPayload = CommonPayload & {
    ActionType: string;
    accountNo?: string;
    accessKey?: string;
    beneficiaryId?: number;
};

export type deleteBeneficicaryPayload = CommonPayload & {
    id?: number;
    otp?: string;
    scope?: string;
};

export interface AddBeneficiaryModalProps {
    accessKeyName?: string;
    open: boolean;
    onCancel: () => void;
    closeAddModal: () => void;
    editValues?: Beneficiary | null;
    beneficiaryActionType: BeneficiaryActionType;
    setBeneficiaryActionType: React.Dispatch<React.SetStateAction<BeneficiaryActionType>>;
}

export type AddBeneficiarySuccessModalProps = {
    open: boolean;
    isEditing: boolean;
    onCancel: () => void;
    data?: any;
};

export enum BeneficiaryActionType {
    ADD = 'ADD',
    EDIT = 'EDIT',
    DELETE = 'DELETE',
}

export type BeneficiaryFormValues = {
    accessKey: string;
    name: string;
    phoneNo?: string;
    serviceProvider: string;
    providerCircle?: string;
    billerId?: string;
    customerParams?: CustomerValuesType[];
    beneficiaryId?: number;
};

export interface UseGetBeneficiariesProps {
    accessKey?: string;
    openOtpModal?: () => void;
    closeOtpModal?: () => void;
    closeAddModal?: () => void;
    openSuccessModal?: () => void;
    closeConfirmationModal?: () => void;
    formRefName?: React.MutableRefObject<FormikProps<any> | null>;
    beneficiaryActionType: BeneficiaryActionType;
    setBeneficiaryActionType: React.Dispatch<React.SetStateAction<BeneficiaryActionType>>;
    editValues?: Beneficiary | null;
    selectedBillerData?: CustomerParam[];
}

export interface PlanDrawerProps {
    isOpen: boolean;
    serviceProvider: string;
    handleClose: () => void;
    plansData: MobilePlan[];
    planCategories: string[];
    isLoading: boolean;
}

export type JriBalanceResponse = {
    Status: string;
    Balance: string;
};

export type PrepaidFormData = {
    mobileNumber: string;
    serviceProvider: string;
    circle: string;
    providerLabel: string;
    circleLabel: string;
    saveToBeneficiaries?: boolean;
    beneficiaryName?: string;
};
