export type BeneficiaryStatus = 'Added' | 'Pending' | 'Failed';

export interface EmployeeRecord {
    name: string;
    email: string;
    initials: string;
    avatarBg: string;
    accountName: string | null;
    accountNumber: string;
    bankName: string;
    ifscCode: string | null;
    upiId: string | null;
    transactionType: string | null;
    remark: string;
    beneficiaryStatus: BeneficiaryStatus;
    bankAccountStatus: string;
}

export interface UpdateEmployeeFormValues {
    accountName: string;
    accountNumber: string;
    bankName: string;
    transactionType: string;
    upiId: string;
    ifscCode: string;
    remark: string;
}

export interface UpdateEmployeeFormHandle {
    submit: () => void;
}

export interface UpdateEmployeeFormProps {
    employee: EmployeeRecord;
    onSave: (values: UpdateEmployeeFormValues) => void;
    isLocked?: boolean;
}
