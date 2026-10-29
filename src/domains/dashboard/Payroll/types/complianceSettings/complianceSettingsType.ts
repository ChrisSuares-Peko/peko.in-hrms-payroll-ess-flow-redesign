export type EpfPayload = {
    epfNumber: string;
    pfWagesPolicy: 'CAPPED_15000' | 'FULL_BASIC';
    enableProRatedPfWage: boolean;
    considerSalaryComponents: boolean;
};

export type EpfApplicabilityHistoryEntry = {
    isApplicable: boolean;
    effectiveMonth: number;
    effectiveYear: number;
    changedAt: string;
    changedBy?: string | null;
};

// GET/PUT .../compliance-settings/epf-applicability — the establishment-level EPF switch
// plus what the settings page needs to decide whether it can be turned off.
export type EpfApplicability = {
    isApplicable: boolean;
    activeEmployeeCount: number;
    mandatoryThreshold: number;
    canDisable: boolean;
    hasProcessedPayroll: boolean;
    // The payroll month a flip made right now takes effect from.
    nextEffectiveMonth: number;
    nextEffectiveYear: number;
    history: EpfApplicabilityHistoryEntry[];
    // "Show PF Employee's Contribution in Earnings" — display only, default OFF.
    showEmployeePfInEarnings: boolean;
    earningsLineHistory: {
        showInEarnings: boolean;
        effectiveMonth: number;
        effectiveYear: number;
        changedAt: string;
        changedBy?: string | null;
    }[];
};

export type EpfApplicabilityResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: EpfApplicability;
};

export type saveEpfResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: EpfPayload;
};

export type EsiPayload = {
    esiNumber: string;
};

export type saveEsiResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: EsiPayload;
};
export type TaxPayload = {
    ptNumber: string;
};

export type LabWelfarePayload = {
    workState: string;
    registrationNumber?: string;
};

export interface BsrDetails {
    bankName?: string;
    bsrCode: string;
}

export interface AuthorizedSignatoryDetails {
    name: string;
    // Father's Name/Signature are no longer collected by the redesigned TDS form, but stay
    // optional here (rather than removed) since a save still merges onto whatever an org
    // already has saved for them server-side.
    fathersName?: string;
    signature?: string; // This could be a URL or file path to the signature image
    placeOfSigning?: string;
}

export interface TdsSettingsPayload {
    tan: string;
    taxRegime?: string;
    assignedCommissioner?: string;
    address?: string;
    bsr: BsrDetails;
    authorizedSignatoryDetails: AuthorizedSignatoryDetails;
}

export type saveLabWelfareResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: LabWelfarePayload;
};

export type ComplianceSettingsResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: {
        epf: {
            epfNumber: string;
            pfWagesPolicy: 'CAPPED_15000' | 'FULL_BASIC';
            enableProRatedPfWage: boolean;
            considerSalaryComponents: boolean;
            isApplicable?: boolean;
            applicabilityHistory?: EpfApplicabilityHistoryEntry[];
            showEmployeePfInEarnings?: boolean;
        };
        esi: {
            esiNumber: string;
            deductionCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
            employeeContribution: number;
            employerContribution: number;
        };
        professionalTax: {
            ptNumber: string;
            deductionCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
            incomeSlabs: {
                incomeStartRange: number;
                incomeEndRange: number;
                taxAmount: number;
                _id: string;
            }[];
        };
        laborWelfareFund: {
            workState: string;
            registrationNumber?: string;
        };
    };
    _id: string;
};

export type UpdateComplianceSettingsPayload = {
    epf?: {
        epfNumber?: string;
        pfWagesPolicy?: 'CAPPED_15000' | 'FULL_BASIC';
        enableProRatedPfWage?: boolean;
        considerSalaryComponents?: boolean;
    };
    esi?: {
        esiNumber?: string;
        deductionCycle?: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
        employeeContribution?: number;
        employerContribution?: number;
        enableEmployerContribution?: boolean;
    };
    professionalTax?: {
        ptNumber?: string;
        deductionCycle?: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
        incomeSlabs?: Array<{
            incomeStartRange: number;
            incomeEndRange: number;
            taxAmount: number;
        }>;
    };
    laborWelfareFund?: {
        workState?: string;
        registrationNumber?: string;
    };
};
