import * as Yup from 'yup';

const referal = Yup.object().shape({
    referralCode: Yup.string().required('Referral code is required'),
    contactPersonName: Yup.string().required('Contact person name is required'),
    contactPersonPhone: Yup.string()
        .required('Contact person phone is required')
        .length(10, 'Phone number must be exactly 10 characters'),
});

export default referal;
