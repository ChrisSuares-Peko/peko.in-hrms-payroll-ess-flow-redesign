import * as Yup from 'yup';

export const ownerDetailsSchema = Yup.object().shape({
    ownerName: Yup.string()
        .min(3, 'Owner name must be at least 3 characters ')
        .required('Please enter the owner name')
        .test(
            'no-leading-whitespace',
            'Owner name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Owner name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Owner name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    percentageOfShare: Yup.string()
        .matches(
            /^(100(\.00?)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/,
            'Percentage must be a valid number between 0 and 100 with up to two decimal places'
        )
        .required('Please enter the percentage of share')
        .test('is-valid-percentage', 'Percentage must be between 0 and 100', value => {
            const numberValue = parseFloat(value);
            return numberValue >= 0 && numberValue <= 100;
        }),
    homeAddress: Yup.string()
        .required('Please enter the home address')
        .min(3, 'Home address must be at least 3 characters ')
        .test(
            'no-leading-whitespace',
            'Home address cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Home address cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Home address cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    nationality: Yup.string().required('Please select the nationality'),
});
export const ownerDocSchema = Yup.object().shape({
    documentType: Yup.string()
        .required('Please enter the document type')
        .min(3, 'Document type name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Document type cannot start with a space'),
    issueDate: Yup.string().required('Please select the issued date'),
    expireDate: Yup.string().required('Please select the expiry date'),
    documentNumber: Yup.string().required('Please enter the document number'),
    //  document: Yup.mixed().required('Please upload document copy'),
});
export const ownerBankDocSchema = Yup.object().shape({
    name: Yup.string()
        .required('Please enter the account holder name')
        .min(3, 'Account holder name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Account name cannot start with a space'),
    swiftcode: Yup.string()
        .nullable()
        .required('Please enter swift code of the employee')
        .matches(
            /^[a-zA-Z0-9]{8,}$/,
            'Swift code must be at least 8 characters long and contain only letters and numbers'
        ),
    iban: Yup.string()
        .required('Please enter IBAN number of the employee')
        .matches(/^AE/, 'IBAN number must start with "AE"')
        .test('is-valid-length', 'IBAN number must be 23 characters long', value => {
            if (value && value.startsWith('AE')) {
                return value.length === 23;
            }
            return true; // If not starting with AE, do not check length here
        })
        .matches(/^[a-zA-Z0-9]+$/, 'IBAN number must contain only letters and numbers')
        .matches(/^AE\d{2}[A-Z0-9]{19}$/, 'Please enter a valid IBAN number starting with AE'),
});
export const companyDocSchema = Yup.object().shape({
    documentName: Yup.string()
        .required('Please enter the document name')
        .min(3, 'Document name must be at least 3 characters ')
        .test(
            'no-leading-whitespace',
            'Document name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Document name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Document name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ) // Not only whitespaces
        .test(
            'not-only-numbers',
            'Document name must contain letters and cannot be numbers only',
            value => !/^\d+$/.test(value) // Ensures it’s not only numbers
        ),
    documentNumber: Yup.string().required('Please enter the document number'),
    issueDate: Yup.string().required('Please select the issued date'),
    // documentBase: Yup.string().required('Please upload document copy'),
});
export const financialDocSchema = Yup.object().shape({
    documentName: Yup.string()
        .required('Please enter the document name')
        .min(3, 'Document name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Document name cannot start with a space')
        .test(
            'not-only-numbers',
            'Document name must contain letters and cannot be numbers only',
            value => !/^\d+$/.test(value) // Ensures it’s not only numbers
        ),
    documentNumber: Yup.string().required('Please enter the document number'),
    documentType: Yup.string()
        .optional()
        .min(3, 'Document type name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Document type cannot start with a space'),
    issueDate: Yup.string().required('Please select the issued date'),
    //  document: Yup.string().required('Please upload document copy'),
});
export const subscriptionDocSchema = Yup.object().shape({
    subscriptionName: Yup.string()
        .required('Please select the software name')
        .trim()
        .min(3, 'Software name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Software name cannot start with a whitespace'),
    planDetails: Yup.string()
        .trim()
        .required('Please enter the plan details')
        .min(3, 'Plan details must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Plan details cannot start with a whitespace'),
    billingCycle: Yup.string().required('Please select the billing cycle'),
    currency: Yup.string().required('Please select the currency'),
    billingStartDate: Yup.string().required('Please select the billing start date'),
    status: Yup.mixed().required('Please select the status'),
    numberOfUsers: Yup.number().optional(),
    amount: Yup.number()
        .required('Please enter the amount')
        .min(0.1, 'Amount must be greater than 0'),
});
export const subscriptionAssignSchema = Yup.object().shape({
    assignTo: Yup.string().required('Please select an employee'),
    cloudSoftwareId: Yup.string().required('Please select the software'),
});
export const assetSchema = Yup.object().shape({
    assetName: Yup.string()
        .required('Please enter the asset name')
        .min(3, 'Asset name must be at least 3 characters ')
        .test(
            'no-leading-whitespace',
            'Asset name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Asset name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Asset name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ) // Not only whitespaces
        .test(
            'not-only-numbers',
            'Asset name must contain letters and cannot be numbers only',
            value => !/^\d+$/.test(value)
        ),
    assetCategory: Yup.string().required('Please select the asset category'),
    serialNumber: Yup.string().required('Please enter the serial number'),
    purchasedDate: Yup.string().optional(),
    assetType: Yup.string().optional(),
    warranty: Yup.string().optional(),
    status: Yup.mixed().required('Please select the status'),
    amount: Yup.string().optional(),
});
export const assetAssignSchema = Yup.object().shape({
    cloudEmployeeId: Yup.string().required('Please select an employee'),
    cloudAssetId: Yup.string().required('Please select the asset'),
    assignDate: Yup.string().required('Please select the assign date'),
    returnDate: Yup.string().optional(),
});
export const assetDocSchema = Yup.object().shape({
    documentName: Yup.string()
        .required('Please enter document name')
        .min(3, 'Document name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Document name cannot start with a space')
        .test(
            'not-only-numbers',
            'Document name must contain letters and cannot be numbers only',
            value => !/^\d+$/.test(value) // Ensures it’s not only numbers
        ),
    documentNumber: Yup.string().required('Please enter document number'),
    issueDate: Yup.string().required('Please select your issue date'),
    //  document: Yup.mixed().required('Please upload document copy'),
});
export const assetInfoSchema = Yup.object().shape({
    assetName: Yup.string()
        .required('Please enter asset name')
        .min(3, 'Asset name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Asset name cannot start with a space'),
    assetCategory: Yup.string().required('Please select asset category'),
    serialNumber: Yup.mixed().required('Please enter serial number'),
    status: Yup.mixed().required('Please select status'),
});
export const assetUsageSchema = Yup.object().shape({
    cloudEmployeeId: Yup.string().required('Please select an employee'),
    //  department: Yup.string().required('Please select department'),
    assignDate: Yup.string().required('Please select the assign date'),
    returnDate: Yup.string().optional(),
    returnStatus: Yup.string().optional(),
    remarks: Yup.string().optional(),
});

export const UserInfoSchema = Yup.object().shape({
    usedBy: Yup.string().required('Please select user'),
    department: Yup.string().required('Please select department'),
    employeeId: Yup.string().required('Please enter employeeId'),
    joiningDate: Yup.string().required('Please select joining date'),
    assignDate: Yup.string().required('Please select assign date'),
    usingFor: Yup.string().required('Please enter using purpose'),
});
export const employeeSchema = Yup.object().shape({
    employeeName: Yup.string()
        .required('Please enter the employee name')
        .min(3, 'Employee name must be at least 3 characters ')
        .test(
            'no-leading-whitespace',
            'Employee name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Employee name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Employee name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    employeeID: Yup.string().required('Please enter the employee ID'),

    employeeEmail: Yup.string()
        .email('Please enter a valid email ID')
        .matches(/^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter valid email')
        .max(55, 'Email must be at most 55 characters')
        .required('Please enter the employee email ID')
        .test(
            'no-leading-whitespace',
            'Email cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Email cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Email cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    department: Yup.string()
        .required('Please enter the department name')
        .min(2, 'Department name must be at least 2 characters ')
        .test(
            'no-leading-whitespace',
            'Department name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Department name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Department name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    joiningDate: Yup.string().required('Please select the date of joining'),
    //   profilePicture: Yup.string().required('Please upload profile picture'),
});
export const vehicleSchema = Yup.object().shape({
    vehicleName: Yup.string()
        .required('Please enter the vehicle name')
        .trim()
        .min(3, 'Vehicle name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Vehicle name cannot start with a space')
        .test(
            'not-only-numbers',
            'Vehicle name must contain letters and cannot be numbers only',
            value => !/^\d+$/.test(value)
        ),
    vehicleType: Yup.string().required('Please select the vehicle type'),
    vehicleNumber: Yup.string().required('Please enter the vehicle number'),
    purchasedDate: Yup.string().required('Please select the purchased date'),
    status: Yup.mixed().required('Please select the status'),
    amount: Yup.string().required('Please enter the amount'),
});
export const fleetAssignSchema = Yup.object().shape({
    cloudEmployeeId: Yup.string().required('Please select an employee'),
    cloudFleetId: Yup.string().required('Please select the asset'),
    assignDate: Yup.string().required('Please select the assign date'),
    returnDate: Yup.string().optional(),
});
export const fleetUsageSchema = Yup.object().shape({
    cloudEmployeeId: Yup.string().required('Please select an employee'),
    assignDate: Yup.string().required('Please select the assign date'),
    returnDate: Yup.string().optional(),
    returnStatus: Yup.string().optional(),
    remarks: Yup.string().optional(),
});
export const vehicleMaintenanceSchema = Yup.object().shape({
    repairCategory: Yup.string()
        .required('Please enter repair category')
        .min(3, 'Repair category must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Repair category cannot start with a space'),
    serviceType: Yup.string()
        .required('Please enter service type')
        .min(3, 'Service type must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Service type cannot start with a space'),
    date: Yup.string().required('Please select assign date'),
    receivedDate: Yup.string().optional(),
    amount: Yup.string().required('Please enter amount'),
    remarks: Yup.string().optional(),
});
export const vehicleInfoSchema = Yup.object().shape({
    vehicleName: Yup.string()
        .required('Please enter the vehicle name')
        .trim()
        .min(3, 'Vehicle name must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Vehicle name cannot start with a space')
        .test(
            'not-only-numbers',
            'Vehicle name must contain letters and cannot be numbers only',
            value => !/^\d+$/.test(value)
        ),
    vehicleType: Yup.string().required('Please select vehicle type'),
    purchasedDate: Yup.string().required('Please select purchased date'),
    vehicleNumber: Yup.mixed().required('Please enter vehicle number'),
    vendor: Yup.string().optional(),
    amount: Yup.mixed().required('Please enter amount'),
    amountRecurring: Yup.mixed().optional(),
    modelYear: Yup.number().optional(),
    chassisNumber: Yup.string().optional(),
    engineTransmission: Yup.string().optional(),
    dateOfRenewal: Yup.string().optional(),
    status: Yup.mixed().required('Please select status'),
    odoMeter: Yup.string().optional(),
});
export const chequeBookSchema = Yup.object().shape({
    bookId: Yup.string().required('Please enter the cheque book ID'),
    accountName: Yup.string()
        .required('Please enter the account holder name')
        .min(3, 'Account holder name must be at least 3 characters')
        .test(
            'no-leading-whitespace',
            'Account holder name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Account holder name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Account holder name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    accountNumber: Yup.string()
        .matches(/^\d{15,}$/, 'Account number must be at least 15 digits')
        .required('Please enter the account number'),
    bankName: Yup.string()
        .required('Please enter the bank name')
        .min(3, 'Bank name must be at least 3 characters')
        .test(
            'no-leading-whitespace',
            'Bank name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Bank name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Bank name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    status: Yup.mixed().required('Please select the cheque book status'),
});
export const chequeLeafSchema = Yup.object().shape({
    type: Yup.mixed().required('Please select the cheque type'),
    payeeName: Yup.string()
        .required('Please enter the payee name')
        .min(3, 'Payee name must be at least 3 characters ')
        .test(
            'no-leading-whitespace',
            'Payee name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Payee name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Payee name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    chequeBookNumber: Yup.string().required('Please enter the cheque book number'),
    chequeNumber: Yup.mixed().required('Please enter the cheque number'),
    bankAccount: Yup.string()
        .required('Please enter the bank name')
        .min(3, 'Bank name must be at least 3 characters ')
        .test(
            'no-leading-whitespace',
            'Bank name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Bank name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Bank name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    dateOfCheque: Yup.string().required('Please select the cheque date'),
    amount: Yup.string().required('Please enter the amount'),
    remarks: Yup.string().optional(),
    signedBy: Yup.string()
        .required('Please enter the signed person name')
        .min(3, 'Signed person name must be at least 3 characters ')
        .test(
            'no-leading-whitespace',
            'Signed person name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Signed person name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Signed person name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    voucherReferance: Yup.string().optional(),
});

export const addOnSchema = Yup.object().shape({
    addonQuantity: Yup.string().required('Please Select additional data limit'),
});
