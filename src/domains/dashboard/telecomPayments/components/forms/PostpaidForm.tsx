import { BBPSCategoryName } from '@customtypes/general';
import DetailPageForm from '@src/domains/dashboard/billPayments/components/forms/DetailPageForm';
import { accessKeys } from '@utils/accessKeys';

const PostpaidForm: React.FC = () => (
    <DetailPageForm
        serviceCategory={BBPSCategoryName.postpaid}
        accessKeyName={accessKeys.postpaid}
    />
);

export default PostpaidForm;
