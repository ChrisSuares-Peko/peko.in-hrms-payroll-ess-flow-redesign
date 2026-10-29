import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useSubscriptionUpdate from '../../hooks/subscriptions/useSubscriptionUpdate';
import { subscriptionSchema } from '../../schema/subscription';
import { SubscriptionBody } from '../../types/subscription';
import SubscriptionForm from '../forms/SubscriptionForm';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: SubscriptionBody;
    handleRefresh: () => void;
};

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const {
        handleSubscriptionCreation,
        updateSubscriptionDetails,
        allVendors,
        subscriptionCategories,
    } = useSubscriptionUpdate();

    return (
        <CustomModalWithForm
            modalTitle="Software Product Management"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const emailsArray = values.pekoEmail
                    .split(/[,\s]+/)
                    .filter((email: string) => email.trim() !== '');
                let result;
                const selectedCategory = subscriptionCategories?.find(
                    // eslint-disable-next-line eqeqeq
                    cat => cat.value == values.categoryId
                );
                if (values.id) {
                    result = await updateSubscriptionDetails({
                        ...values,
                        pekoEmail: emailsArray,
                        categoryName: selectedCategory?.label,
                    });
                } else {
                    result = await handleSubscriptionCreation({
                        ...values,
                        pekoEmail: emailsArray,
                        categoryName: selectedCategory?.label,
                    });
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            validationSchema={subscriptionSchema}
            initialValues={{
                id: data?.id || '',
                productId: data?.productId || '',
                name: data?.name || '',
                description: data?.description || '',
                features: data?.features || '',
                image: data?.image || '',
                imageFormat: '',
                pekoEmail: data?.pekoEmail.join(',') || '',
                sendMail: data?.sendMail || false,
                sendVendorMail: data?.sendVendorMail || false,
                typeOfOrder: data?.typeOfOrder || '',
                vendorId: data?.vendorId || '',
                categoryId: data?.categoryId || '',
                discount: data?.discount || '',
            }}
        >
            <SubscriptionForm
                vendorData={allVendors}
                subscriptionCategories={subscriptionCategories}
                records={data}
            />
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
