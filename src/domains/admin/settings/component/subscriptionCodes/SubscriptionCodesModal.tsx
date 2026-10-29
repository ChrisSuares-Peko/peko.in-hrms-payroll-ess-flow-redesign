import { Flex, Form, Skeleton } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import useGetPackages from '@domains/admin/settings/hooks/subscriptionCodes/useGetPackages';
import useUpdateCodes from '@domains/admin/settings/hooks/subscriptionCodes/useUpdateCodes';
import { SubscriptionCode } from '@domains/admin/settings/types/subscriptionCodes';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import subscriptionCodeSchema from '../../schema/subscriptionCode';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: SubscriptionCode;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

const SubscriptionCodesModal = ({ open, handleCancel, data, setRefresh }: ModalProps) => {
    const {
        packageData,
        isLoading: packagLoading,
        setPartnerId,
    } = useGetPackages({ partnerId: data?.partnerId || 'default' });
    const { partnerData } = usePartnersForCorporate('');
    const { isLoading, createActivationCode, updateActivationCode } = useUpdateCodes({
        handleCancel,
        setRefresh,
    });
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Subscription Code Management"
            open={open}
            validationSchema={subscriptionCodeSchema}
            handleCancel={handleCancel}
            handleFormSubmit={values =>
                data
                    ? updateActivationCode({ ...values, id: data.id })
                    : createActivationCode(values)
            }
            initialValues={{
                billingType: data?.billingType || '',
                packageId: data?.packageId || '',
                activationCode: data?.activationCode || '',
                quantity: 1,
                partnerId: data?.partnerId || 'default',
            }}
        >
            {({ setFieldValue, values }) => (
                <Flex vertical className=" w-full">
                    <Form layout="vertical">
                        {partnerData ? (
                            <SelectInput
                                name="partnerId"
                                options={partnerData}
                                placeholder="Please select a partner"
                                label="Select Partner"
                                handleChange={e => {
                                    setFieldValue('packageId', '');
                                    setPartnerId(e);
                                }}
                            />
                        ) : (
                            <Skeleton.Input active block />
                        )}
                        {!packagLoading ? (
                            <SelectInput
                                isRequired
                                name="packageId"
                                options={packageData}
                                placeholder="Please select a package"
                                label="Package Name"
                            />
                        ) : (
                            <Skeleton.Input active block />
                        )}
                        <SelectInput
                            filterOption={false}
                            isRequired
                            name="billingType"
                            options={[
                                { value: 'MONTHLY', label: 'MONTHLY' },
                                { value: 'ANNUALLY', label: 'ANNUALLY' },
                            ]}
                            placeholder="Please select a billing type"
                            label="Select Billing Type"
                        />
                        {data && (
                            <TextInput
                                isDisabled
                                name="activationCode"
                                label="Activation Code"
                                type="text"
                                isRequired
                                classes="rounded-sm"
                            />
                        )}
                        {!data && (
                            <TextInput
                                name="quantity"
                                label="Quantity"
                                type="text"
                                placeholder="Please enter the quantity"
                                classes="rounded-sm"
                                isRequired
                                allowNumbersOnly
                                maxLength={3}
                            />
                        )}
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default SubscriptionCodesModal;
