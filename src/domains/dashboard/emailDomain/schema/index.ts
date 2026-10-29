import * as Yup from 'yup';

export const WorkspaceSchema = (isGoogleWorkSpace: boolean) =>
    Yup.object().shape({
        companyName: Yup.string()
            .trim()
            .min(3, 'Company name must be at least 3 characters')
            .matches(/^[A-Za-z0-9&\-_.\s]+$/, 'Please enter a valid company name')
            .required('Please enter the company name')
            .test(
                'contains-letters',
                'Please enter a valid company name',
                value => /[A-Za-z]/.test(value) // Ensures at least one letter
            )
            .test(
                'no-leading-whitespace',
                'Company name cannot start with whitespace',
                value => !/^\s/.test(value)
            )
            .test(
                'no-multiple-whitespace',
                'Company name cannot contain consecutive whitespaces',
                value => !/\s{2,}/.test(value)
            )
            .test(
                'not-only-whitespace',
                'Company name cannot be only whitespace',
                value => !/^\s*$/.test(value)
            ),

        // Conditional validations based on isGoogleWorkSpace
        ...(isGoogleWorkSpace
            ? {
                  currentEmailProvider: Yup.string()
                      .trim()
                      .required('Please select an email provider'),

                  alternativeEmailId: Yup.string()
                      .trim()
                      .email('Please enter a valid alternative email ID')
                      .matches(
                          /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          'Please enter a valid alternative email ID'
                      )
                      .optional(),
                  agreeToTerms: Yup.boolean().oneOf(
                      [true],
                      'Accept the terms and conditions to proceed.'
                  ),
              }
            : {
                  // Validations for when isGoogleWorkSpace is false
                  companyAddress: Yup.string()
                      .trim()
                      .min(3, 'Address must be at least 3 characters')
                      .required('Please enter the company address'),

                  //   emirates: Yup.string().trim().required('Please select the emirate'),

                  city: Yup.string()
                      .trim()
                      .min(3, 'City must be at least 3 characters')
                      .required('Please enter the city')
                      .test(
                          'contains-letters',
                          'Please enter a valid city name',
                          value => /[A-Za-z]/.test(value) // Ensures at least one letter
                      ),
                  zipcode: Yup.string()
                      .trim()
                      .matches(/^[0-9]{5,10}$/, 'Please enter a valid zip code')
                      .required('Please enter the zip code')
                      .max(10, 'Zip code cannot exceed 10 characters'),
              }),

        numberOfUsers: Yup.number()
            .required('Please enter the number of email accounts')
            .moreThan(0, 'Number of users must be greater than zero'),

        name: Yup.string()
            .trim()
            .min(3, 'Name must be at least 3 characters')
            .matches(/^[A-Za-z\s]+$/, 'Name can only contain alphabetic characters')
            .required('Please enter the name')
            .test(
                'no-leading-whitespace',
                'Name cannot start with whitespace',
                value => !/^\s/.test(value) // Check if starts with whitespace
            )
            .test(
                'no-multiple-whitespace',
                'Name cannot contain consecutive whitespaces',
                value => !/\s{2,}/.test(value)
            ) // No consecutive spaces
            .test(
                'not-only-whitespace',
                'Name cannot be only whitespace',
                value => !/^\s*$/.test(value)
            ), // Not only whitespaces,,

        domainName: Yup.string()
            .trim()
            .min(3, 'Domain name must be at least 3 characters')
            .required('Please enter the domain name')
            .matches(
                /^(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,6}$/,
                'Please enter a valid domain name'
            ) // Valid domain format
            .test(
                'no-leading-whitespace',
                'Domain name cannot start with whitespace',
                value => !/^\s/.test(value) // No leading whitespace
            )
            .test(
                'no-multiple-whitespace',
                'Domain name cannot contain consecutive whitespaces',
                value => !/\s{2,}/.test(value)
            ) // No consecutive spaces
            .test(
                'not-only-whitespace',
                'Domain name cannot be only whitespace',
                value => !/^\s*$/.test(value)
            ), // Not only whitespaces

        emailId: Yup.string()
            .trim()
            .email('Please enter a valid email ID')
            .matches(
                /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'Please enter a valid email ID'
            )
            .required('Please enter the email ID'),

        mobileNumber: Yup.string()
            .trim()
            .min(10, 'Mobile number must be at least 10 digits')
            .matches(/^[0-9]{10}$/, 'Please enter valid mobile number')
            .required('Please enter the mobile number'),
    });
