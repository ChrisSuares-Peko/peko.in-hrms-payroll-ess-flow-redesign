import { useState } from 'react';

import { debounce } from 'lodash';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { formatNumberWithoutCommas } from '@utils/priceFormat';

import useSubscriptionUpdate from '../../hooks/subscriptionPlans/useSubscriptionPlansUpdate';
import { subscriptionPlanSchema } from '../../schema/subscription';
import { SubscriptionPlan } from '../../types/subscriptionPlans';
import SubscriptionPlansForm from '../forms/SubscriptionPlansForm';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: SubscriptionPlan;
    handleRefresh: () => void;
};

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const [searchText, setSearchText] = useState<string>('');
    const { isLoading, handleSubscriptionCreation, updateSubscriptionDetails, allSoftwares } =
        useSubscriptionUpdate(searchText);

    const debounceSearch = debounce((searchQuery: string) => {
        setSearchText(searchQuery);
    }, 300);

    return (
        <CustomModalWithForm
            modalTitle="Software Plan Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let result;
                if (values.id) {
                    result = await updateSubscriptionDetails(values);
                } else {
                    result = await handleSubscriptionCreation(values);
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            validationSchema={subscriptionPlanSchema}
            initialValues={{
                id: data?.id || '',
                softwareId: data?.softwareId || '',
                planId: data?.planId || '',
                name: data?.name || '',
                vendorPrice: formatNumberWithoutCommas(data?.vendorPrice || 0) || '',
                price: formatNumberWithoutCommas(data?.price || 0) || '',
                validity: data?.validity || '',
                noOfUsers: data?.noOfUsers || 1,
                features: data?.features || '',
                GST: data?.GST || '',
                gstType: data?.gstType || '',
            }}
        >
            <SubscriptionPlansForm allSoftwares={allSoftwares} handleSearch={debounceSearch} />
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
