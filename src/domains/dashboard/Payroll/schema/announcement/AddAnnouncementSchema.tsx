import * as Yup from 'yup';

export const addAnouncementSchema = Yup.object().shape({
    subject: Yup.string()
        .test('no-leading-space', 'Subject cannot start with a whitespace', value => value ? !/^\s/.test(value) : true
        )
        .test('no-trailing-space', 'Subject cannot end with a whitespace', value => value ? !/\s$/.test(value) : true
        )
        .test('no-multiple-consecutive-spaces', 'Subject cannot contain consecutive whitespaces', value => value ? !/\s{2,}/.test(value) : true
        )
        .min(3, 'Subject must be at least 3 characters')
        .required('Please enter the subject'),
    details: Yup.string()
        .test('no-leading-space', 'Details cannot start with a whitespace', value => value ? !/^\s/.test(value) : true
        )
        .test('no-trailing-space', 'Details cannot end with a whitespace', value => value ? !/\s$/.test(value) : true       
        )
        .test('no-multiple-consecutive-spaces', 'Details cannot contain consecutive whitespaces', value => value ? !/\s{2,}/.test(value) : true
        )
        .min(3, 'Details must be at least 3 characters')
        .required('Please enter the details'),
});
