import * as Yup from 'yup';

const template = Yup.object().shape({
    type: Yup.string().required('Please select the type'),
    subject: Yup.string().required('Please enter the subject'),
    body: Yup.string().required('Please enter the body'),
});

export default template;
