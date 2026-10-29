import { BBPSCategoryName } from '@customtypes/general';
import DetailPageForm from '@src/domains/dashboard/billPayments/components/forms/DetailPageForm';
import { accessKeys } from '@utils/accessKeys';

const TestForm: React.FC = () => (
    <DetailPageForm serviceCategory={BBPSCategoryName.test} accessKeyName={accessKeys.test} />
);

export default TestForm;
