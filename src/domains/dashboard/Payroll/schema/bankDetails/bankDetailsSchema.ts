import * as Yup from 'yup';


export const bankSchema = Yup.object().shape({
  accountName: Yup.string()
    .required('Please enter the account holder name')
    .test(
      'no-start-whitespace',
      'Account holder name cannot start with whitespace',
      value => !value || !/^\s/.test(value)
    )
    .test(
      'no-end-whitespace',
      'Account holder name cannot end with whitespace',
      value => !value || !/\s$/.test(value)
    )
    .test(
      'no-consecutive-whitespace',
      'Account holder name cannot contain consecutive whitespaces',
      value => !value || !/\s{2,}/.test(value)
    )
    .min(3, 'Account holder name must be at least 3 characters')
    .max(100, 'Account holder name cannot exceed 100 characters'),

  accountNumber: Yup.string()
    .required('Please enter account number')
    .matches(/^\d+$/, 'Account number must contain only digits')
    .min(5, 'Account number must be between 5 to 25 digits.')
    .max(25, 'Account number cannot exceed 25 digits'),

  bankName: Yup.string()
    .required('Please enter bank name')
    .test(
      'no-start-whitespace',
      'Bank name cannot start with whitespace',
      value => !value || !/^\s/.test(value)
    )
    .test(
      'no-end-whitespace',
      'Bank name cannot end with whitespace',
      value => !value || !/\s$/.test(value)
    )
    .test(
      'no-consecutive-whitespace',
      'Bank name cannot contain consecutive whitespaces',
      value => !value || !/\s{2,}/.test(value)
    )
    .min(3, 'Bank name must be at least 3 characters')
    .max(100, 'Bank name cannot exceed 100 characters'),

  ifscCode: Yup.string()
    .required('Please enter IFSC code')
    .matches(
      /^[A-Z]{4}0[A-Z0-9]{6}$/,
      'Please enter a valid IFSC code (e.g., SBIN0001234)'
    )
    .test(
      'no-whitespace',
      'IFSC code cannot contain whitespace',
      value => !value || !/\s/.test(value)
    ),

  isDefaultAccount: Yup.boolean().default(false),
});

