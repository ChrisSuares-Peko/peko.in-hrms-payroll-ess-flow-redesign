import { FormikProps } from 'formik';

import { BillerPaymentChannelInfo } from '@customtypes/general';

export type CommonPayload = {
    userId: number;
    userType: string;
};

export type GetServiceProvidersPayload = CommonPayload & {
    categoryName: string;
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
};
export type useFilterCommon = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId?: string | number;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    from?: string;
    to?: string;
    corporateId?: string | number;
    category?: string | number;
};
export type filterState = {
    type?: string;
    title?: string;
    searchText: string;
    category: string;
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
    from: string;
    to: string;
    sortField: string;
};

export type CustomerParam = {
    dataType: string;
    maxLength: number;
    minLength: number;
    isOptional: string;
    paramName: string;
    regEx: string;
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
    billerPaymentExactness?: string;
    billerSupportBillValidation?: string;
    billerAdhoc?: string;
    interchangeFeeCCF1?: string;
}

export type ServiceProviderResponse = {
    billersArray: biller[];
};

export type CustomerValuesType = {
    paramName?: string;
    paramValue?: string;
    name?: string;
    value?: string;
};

export type FetchBillPayload = CommonPayload & {
    apiPath: string;
    billerId: string;
    customerParams: CustomerValuesType[];
};

export enum billAmountType {
    exact = 'Exact',
    any = 'Any',
    above = 'Exact and above',
    below = 'Exact and below',
}

// export type FetchBillResponse = {
//     data: {
//         billerRefId: string;
//         refId: string;
//         bill: {
//             amount: number;
//             customerName: string;
//             billPeriod: string;
//             billDate: string;
//             dueDate: string;
//             maxAmount: number;
//             minAmount: number;
//         };
//         exactness: string;
//     };
// };

export type FetchBillResponse = {
    data: {
        billAmount: string;
        billDate: string;
        billNumber: string;
        billPeriod: string;
        customerName: string;
        dueDate: string;
        requestId: string;
    };
};

export type OptionsType = {
    value: string;
    label: string;
    customerParams: CustomerParam[] | [];
    billerFetchRequiremet?: string;
    billerFetchRequirement?: string;
    billerPaymentExactness?: string;
    billerSupportBillValidation?: string;
    billerAdhoc?: string;
    interchangeFeeCCF1?: string;
    billerPaymentChannels?: {
        paymentChannelInfo?: BillerPaymentChannelInfo | BillerPaymentChannelInfo[];
    };
};

export type StateListResponse = {
    states: OptionsType[];
};

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
    // otp: string;
    // scope: string;
};

export type deleteBeneficicaryPayload = CommonPayload & {
    id?: number;
    otp?: string;
    scope?: string;
};

export interface AddBeneficiaryModalProps {
    accessKeyName?: string;
    open: boolean;
    closeAddModal: () => void;
    editValues?: Beneficiary | null;
    beneficiaryActionType: BeneficiaryActionType;
    setBeneficiaryActionType: React.Dispatch<React.SetStateAction<BeneficiaryActionType>>;
}

export type BeneficiaryFormValues = {
    accessKey?: string;
    name: string;
    serviceProvider: string;
    billerId: string;
    customerParams: CustomerValuesType[];
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

export interface BeneficiariesListProps {
    accessKeyName?: string;
}

export enum BeneficiaryActionType {
    ADD = 'ADD',
    EDIT = 'EDIT',
    DELETE = 'DELETE',
}

export type SendOtpPayload = CommonPayload & {
    ActionType: string;
    accountNo?: string;
    accessKey?: string;
    beneficiaryId?: number;
};

export interface BeneficiaryFormProps {
    service?: string;
    setService: React.Dispatch<React.SetStateAction<string | undefined>>;
    accessKeyName?: string;
    selectedBillerData: CustomerParam[];
    setSelectedBillerData: React.Dispatch<React.SetStateAction<CustomerParam[]>>;
    editValues?: Beneficiary | null;
}

export interface UserEnteredFormValues {
    accessKey: string;
    billerId: string;
    name: string;
}
