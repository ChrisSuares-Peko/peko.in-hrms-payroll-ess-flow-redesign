import * as Yup from 'yup';

const referal = Yup.object().shape({
    reward: Yup.string().required('Please enter the referral reward'),
});

export default referal;
