import { Flex, Form, Skeleton } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import UseUpdateReferalCodes from '../../hooks/UseUpdateReferalCodes';
import referal from '../../schema/referal';
import { Referral, refresh } from '../../types/refferalCode';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Referral;
};

const RefferalCodeModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: DepartmentModalProps & refresh) => {
    const { isLoading, createNewReferal, updateCurrentreferal } = UseUpdateReferalCodes({
        handleCancel,
        setRefresh,
    });
    const { partnerData } = usePartnersForCorporate('');

    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Referral Code Management"
            open={open}
            validationSchema={referal}
            handleCancel={handleCancel}
            handleFormSubmit={async values =>
                data ? updateCurrentreferal(values) : createNewReferal(values)
            }
            initialValues={{
                id: data?.id || '',
                referralCode: data?.referralCode || '',
                contactPersonName: data?.contactPersonName || '',
                contactPersonPhone: data?.contactPersonPhone || '',
                partnerId: data?.partnerId === null ? null : data?.partnerId || '',
            }}
        >
            <Flex vertical className="w-full ">
                <Form layout="vertical">
                    {partnerData ? (
                        <SelectInput
                            name="partnerId"
                            options={partnerData.map(option => ({
                                ...option,
                                value: option.value === 'default' ? null : option.value.toString(),
                            }))}
                            placeholder="Please select a partner"
                            label="Select Partner"
                            isRequired
                        />
                    ) : (
                        <Skeleton.Input active block />
                    )}
                    <TextInput
                        allowAlphabetsAndNumbersOnly
                        name="referralCode"
                        label="Referral Code"
                        type="text"
                        placeholder="Please enter referral code"
                        isRequired
                        classes=" rounded-sm"
                    />
                    <TextInput
                        name="contactPersonName"
                        label="Contact Person Name"
                        type="text"
                        placeholder="Please enter contact person name"
                        isRequired
                        classes=" rounded-sm"
                    />
                    <TextInput
                        allowNumbersOnly
                        name="contactPersonPhone"
                        label="Contact Person Mobile"
                        type="text"
                        placeholder="Please enter contact person mobile"
                        isRequired
                        classes=" rounded-sm"
                        maxLength={10}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default RefferalCodeModal;
