import * as Yup from 'yup';

export const offBoardEmployeeSchema = Yup.object().shape({
    lastWorkingDay: Yup.date()
        .required('Please select last working day of the employee')
        .nullable()

        .typeError('Please provide a valid date'),
    offBoardingDate: Yup.date()
        .required('Please select offboarding date of the employee')
        .nullable()

        .typeError('Please provide a valid date'),

    noticePeriod: Yup.number()
        .typeError('Please enter a valid number') // if user types non-digit
        .required('Please enter notice period')
        .min(0, 'Cannot be negative'),

    offBoardingType: Yup.string().required('Please select the type of exit of the employee'),
    reasonForOffBoarding: Yup.string()
        .optional()
        .test(
            'no-leading-trailing-spaces',
            'Reason cannot start or end with a blank space',
            value => {
                if (!value) return true; // allow empty
                return value === value.trim();
            }
        )
        .matches(/^(?!.*\s{2,}).*$/, 'Reason cannot contain consecutive blank spaces')
        .min(3, 'Reason must be at least 3 characters')
        .max(500, 'Reason cannot be more than 500 characters'),

    resignationLetter: Yup.mixed().nullable(),
});
