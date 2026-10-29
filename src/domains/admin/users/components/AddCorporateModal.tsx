import { useState } from 'react';

import { Flex, Form } from 'antd';

import indianFlag from '@assets/svg/indianFlag.svg';
import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import usePartnersForCorporate from '../hooks/usePartnersForCorporate';
import { addCorporateSchema } from '../schema';
import { AddNewCorporate } from '../types/corporateUserTypes';

type EditUserProps = {
    open: boolean;
    isDisabled: boolean;
    partnerSelected: string;
    handleCancel: () => void;
    addNewCorporate: (values: AddNewCorporate) => Promise<boolean>;
};

const AddCorporateModal = ({
    open,
    handleCancel,
    addNewCorporate,
    isDisabled,
    partnerSelected,
}: EditUserProps) => {
    const { categoryDatas, loading } = usePartnersForCorporate('');
    const [isLoading, setIsLoading] = useState(false);
    const initialValues = {
        name: '',
        contactPersonName: '',
        email: '',
        mobileNo: '',
        countryCode: '971',
        registeredBy: partnerSelected || 'default',
        autoPasswordGeneration: true,
    };
    return (
        <CustomModalWithForm
            modalTitle="Add Corporate Account"
            open={open}
            reinitialise
            validationSchema={addCorporateSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                setIsLoading(true);
                if (!values.registeredBy || values.registeredBy === 'default')
                    delete values.registeredBy;
                const res = await addNewCorporate({
                    ...values,
                });
                if (res) {
                    handleCancel();
                }
                setIsLoading(false);
            }}
            initialValues={initialValues}
            isLoading={isLoading}
            isDisabled={isLoading}
        >
            <Flex vertical className="w-full ">
                <Form layout="vertical">
                    <CustomSelectSearch
                        name="registeredBy"
                        options={
                            categoryDatas?.length
                                ? [
                                      { oName: 'Default', oValue: 'default' },
                                      ...(categoryDatas || []).map(d => ({
                                          oValue: `${d.id}`,
                                          oName: d.name,
                                      })),
                                  ]
                                : []
                        }
                        placeholder="Select partner"
                        label="Partner"
                        loading={loading}
                        isDisabled={isDisabled}
                        allowClear={false}
                    />
                    <TextInput
                        name="contactPersonName"
                        label="Contact Person Name"
                        type="text"
                        placeholder="Enter contact person name"
                        isRequired
                        classes=" rounded-sm"
                        maxLength={50}
                    />
                    <TextInput
                        name="name"
                        label="Company Name"
                        type="text"
                        placeholder="Enter company name"
                        isRequired
                        classes=" rounded-sm"
                        maxLength={50}
                    />
                    <TextInput
                        name="mobileNo"
                        label="Mobile Number"
                        type="text"
                        placeholder="Enter mobile number"
                        classes=" rounded-sm"
                        allowNumbersOnly
                        minLength={10}
                        isRequired
                        maxLength={10}
                        prefix={
                            <Flex justify="center" align="center">
                                <img src={indianFlag} alt="India Flag" className="w-4 h-4 mr-2" />
                                +91
                            </Flex>
                        }
                    />
                    <TextInput
                        name="email"
                        label="Email ID"
                        type="text"
                        placeholder="Enter email ID"
                        isRequired
                        classes=" rounded-sm"
                        maxLength={50}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default AddCorporateModal;
