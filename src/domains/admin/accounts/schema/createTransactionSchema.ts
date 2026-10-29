import * as Yup from 'yup';

export const createTransactionSchema = Yup.object().shape({
    corporateId: Yup.string().required('Please select a user'),
    rechargeAmount: Yup.string().required('Please enter recharge amount'),
    accountNo: Yup.string().required('Please enter account No'),
    merchantCommission: Yup.string().required('Please enter merchant commission'),
    adminCommission: Yup.string().required('Please enter admin commission'),
    serviceType: Yup.string().required('Please select the service type'),
    transactionId: Yup.string().required('Please enter transaction Id'),
    orderId: Yup.string().required('Please enter order Id'),
    providerId: Yup.string().required('Please enter provider Id'),
    serviceOperatorId: Yup.string().required('Please select a service provider'),
    surcharge: Yup.string().required('Please enter surcharge'),
});
