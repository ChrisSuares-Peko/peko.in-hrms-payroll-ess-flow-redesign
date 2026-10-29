import * as Yup from 'yup';

const CloneModalSchema = Yup.object().shape({
    // registeredBy: Yup.string().required('Please select a partner.'),
    toPartner: Yup.string().nullable().required('Please select to partner.'),
});

export default CloneModalSchema;
