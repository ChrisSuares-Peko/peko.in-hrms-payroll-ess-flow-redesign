import { BankAccountSetupFormValues } from '../types/remittance';

const useCompanyDetailsSubmit = () => {
    const handleSubmit = (values: BankAccountSetupFormValues) => {
        console.log('Company details submitted:', values);
    };

    return { handleSubmit };
};

export default useCompanyDetailsSubmit;
