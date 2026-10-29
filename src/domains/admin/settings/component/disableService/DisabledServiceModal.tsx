import { useState } from 'react';

import { Flex, Form, Select, Skeleton } from 'antd';
import { Field, FieldProps } from 'formik';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import MultiSelectInput from '@components/atomic/inputs/MultiSelectInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useAddDisabledService from '../../hooks/disableService/useAddDisabledService';
import disabledServiceSchema from '../../schema/disabledServiceSchema';
import { refresh } from '../../types/disabledTypes';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
};

const DisabledServiceModal = ({
    open,
    handleCancel,
    setRefresh,
}: DepartmentModalProps & refresh) => {
    const [searchCorporate, setSearchCorporate] = useState<string>('');
    const [selectedPartnerId, setselectedPartnerId] = useState<string>('');
    const [selectedSubPartnerId, setselectedSubPartnerId] = useState<string>('');
    const {
        corporateData,
        operatorData,
        createDisabledServices,
        partnerData,
        isLoading,
        isSubPartnerLoading,
        subPartnerData,
    } = useAddDisabledService({
        searchCorporate,
        searchOperator: '',
        partnerId: selectedPartnerId,
        subPartnerId: selectedSubPartnerId,
    });

    const dispatch = useAppDispatch();
    return (
        <CustomModalWithForm
            modalTitle="Disable Service Management"
            open={open}
            validationSchema={disabledServiceSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const res: boolean = await createDisabledServices({
                    credentialId: values.credentialId,
                    serviceOperatorIds: values.serviceOperatorIds,
                });

                if (res === true) {
                    setRefresh(true);

                    dispatch(
                        showToast({
                            description: `Disabled service added successfully`,
                            variant: 'success',
                        })
                    );
                }
                if (res === false) {
                    dispatch(
                        showToast({
                            description: `Something went wrong ,please try again later`,
                            variant: 'error',
                        })
                    );
                }
                handleCancel();
            }}
            initialValues={{
                credentialId: '',
                serviceOperatorIds: [],
            }}
        >
            <Flex vertical className=" w-full">
                <Form layout="vertical">
                    <CustomSelectSearch
                        name="partner"
                        options={partnerData || []}
                        placeholder="Select a partner"
                        allowClear
                        label="Select Partner"
                        loading={isLoading}
                        defaultValue="default"
                        onChange={e => {
                            if (!e || e === 'default') {
                                setselectedPartnerId('');
                                setselectedSubPartnerId('');
                            } else {
                                setselectedPartnerId(e);
                                setselectedSubPartnerId('');
                            }
                        }}
                        onClear={() => {
                            setselectedPartnerId('');
                            setselectedSubPartnerId('');
                        }}
                    />
                    {subPartnerData && subPartnerData.length ? (
                        <CustomSelectSearch
                            name="subPartner"
                            label="Select Sub Partner"
                            options={subPartnerData || []}
                            placeholder="Select a sub partner"
                            allowClear
                            loading={isSubPartnerLoading}
                            defaultValue="default"
                            onChange={e => {
                                if (!e || e === 'default') {
                                    setselectedSubPartnerId('');
                                } else {
                                    setselectedSubPartnerId(e);
                                }
                            }}
                            onClear={() => {
                                setselectedSubPartnerId('');
                            }}
                        />
                    ) : (
                        ''
                    )}
                    <Field name="credentialId">
                        {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                            <Form.Item
                                validateStatus={
                                    touched.credentialId && errors.credentialId ? 'error' : ''
                                }
                                help={
                                    touched.credentialId && errors.credentialId
                                        ? (errors.credentialId as React.ReactNode)
                                        : undefined
                                }
                                name="credentialId"
                                label="Select Corporate User"
                                required
                            >
                                {corporateData ? (
                                    <Select
                                        allowClear
                                        showSearch
                                        className="w-full"
                                        placeholder="Please select a corporate user"
                                        options={corporateData}
                                        onChange={e => setFieldValue('credentialId', e)}
                                        onSearch={setSearchCorporate}
                                        defaultActiveFirstOption={false}
                                        filterOption={false}
                                    />
                                ) : (
                                    <Skeleton.Input block active />
                                )}
                            </Form.Item>
                        )}
                    </Field>
                    {operatorData ? (
                        <MultiSelectInput
                            name="serviceOperatorIds"
                            options={operatorData || []}
                            label="Select Service Operator"
                            placeholder="Please select a service operator"
                            isRequired
                            filterOption
                            showSelectAll
                        />
                    ) : (
                        <Skeleton.Input block active />
                    )}
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default DisabledServiceModal;
