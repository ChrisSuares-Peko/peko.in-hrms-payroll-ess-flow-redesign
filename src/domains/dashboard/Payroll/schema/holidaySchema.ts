import * as Yup from 'yup';

export const holidaySchema = Yup.object().shape({
    title: Yup.string()
    .matches(/^[^\s].*$/, 'Holiday name cannot start with a whitespace')
    .matches(/.*[^\s]$/, 'Holiday name cannot end with a whitespace')
    .matches(/^(?!.*\s{2,}).*$/, 'Holiday name cannot contain consecutive whitespaces')
    .min(3, 'Holiday name must be at least 3 characters')
    .required('Please enter holiday name'),
    start: Yup.string().required('Please select start date'),
    end: Yup.string().required('Please select end date'),
    sendPriorEmailDate: Yup.string().required('Please select the date to send prior email'),
});
