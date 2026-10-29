import * as Yup from 'yup';

const cashbackSchema = Yup.object().shape({
    partnerId: Yup.string().required('Please select the partner'),
    packageId: Yup.string().required('Please select the package'),
    serviceOperatorId: Yup.string().required('Please select the service operator'),
    cashbackType: Yup.string().required('Please select the commission type'),
    surchargeType: Yup.string().required('Please select the surcharge type'),
    cashback: Yup.string().required('Please select the cashback'),
    surcharge: Yup.string().required('Please select the surcharge'),
});

export default cashbackSchema;
