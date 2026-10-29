export interface IncomeDeclarationFormPayload {
    employee: string;
    financialYear: string;

    hraDetails: {
        totalRentPaid: number;
        landlordName: string;
        landlordPAN: string;
        rentedPropertyAddress: string;
        rentReceipts: string;
    };

    ltaDetails: {
        ltaAmountClaimed: number;
        travelDate: string; // e.g., "2024-12-20"
        travelDestination: string;
        travelProof: string;
    };

    homeLoanInterestDetails: {
        interestPaid: number;
        lenderName: string;
        lenderPAN: string;
        lenderAddress: string;
        loanProof: string;
    };

    incomeDeclaration: {
        annualIncome: number;
        incomeProof: string;
    };

    chapterVIA: {
        investmentType: string;
        amountInvested: number;
        proofDocument: string;
    }[];

    homeLoanDeductions: {
        deductionType: string;
        amountClaimed: number;
        institutionName: string;
        certificationDate: string; // e.g., "2024-03-31"
        proofDocument: string;
    }[];
}

export interface IncomeDeclarationFormPostResponse {
    id: string;
    corporateUser: string;
    employee: string;
    financialYear: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string

    hraDetails: {
        totalRentPaid: number;
        landlordName: string;
        landlordPAN: string;
        rentedPropertyAddress: string;
        rentReceipts: string;
    };

    ltaDetails: {
        ltaAmountClaimed: number;
        travelDate: string; // ISO date string
        travelDestination: string;
        travelProof: string;
    };

    homeLoanInterestDetails: {
        interestPaid: number;
        lenderName: string;
        lenderPAN: string;
        lenderAddress: string;
        loanProof: string;
    };

    incomeDeclaration: {
        annualIncome: number;
        incomeProof: string;
    };

    chapterVIA: {
        _id: string;
        investmentType: string;
        amountInvested: number;
        proofDocument: string;
    }[];

    homeLoanDeductions: {
        _id: string;
        deductionType: string;
        amountClaimed: number;
        institutionName: string;
        certificationDate: string; // ISO date string
        proofDocument: string;
    }[];
}
export interface IncomeDeclarationFormGetResponse {
    id: string;
    corporateUser: string;
    employee: string;
    financialYear: string;
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string

    hraDetails: {
        totalRentPaid: number;
        landlordName: string;
        landlordPAN: string;
        rentedPropertyAddress: string;
        rentReceipts: string;
    };

    ltaDetails: {
        ltaAmountClaimed: number;
        travelDate: string; // ISO Date string
        travelDestination: string;
        travelProof: string;
    };

    homeLoanInterestDetails: {
        interestPaid: number;
        lenderName: string;
        lenderPAN: string;
        lenderAddress: string;
        loanProof: string;
    };

    incomeDeclaration: {
        annualIncome: number;
        incomeProof: string;
    };

    chapterVIA: {
        _id: string;
        investmentType: string;
        amountInvested: number;
        proofDocument: string;
    }[];

    homeLoanDeductions: {
        _id: string;
        deductionType: string;
        amountClaimed: number;
        institutionName: string;
        certificationDate: string; // ISO Date string
        proofDocument: string;
    }[];
}
