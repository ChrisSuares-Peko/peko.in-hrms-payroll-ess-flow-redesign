import { Flex, Form } from 'antd';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import OptionalForm from './OptionalForm';
import useIndianStates from '../../hooks/useIndianStates';
import useVendorUpdate from '../../hooks/useVendorUpdate';
import { vendorData } from '../../schema/vendor';
import { Vendor } from '../../types/vendors';
import { vendorTypes } from '../../utils/vendorsType';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Vendor;
    handleRefresh: () => void;
};

const VendorModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const { isLoading, handleVendorCreation, updateVendorDetails } = useVendorUpdate();
    const { stateOptions } = useIndianStates();

    return (
        <CustomModalWithForm
            modalTitle="Vendor Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const emailsArray = values.vendorEmail
                    .split(/[,\s]+/)
                    .filter((email: string) => email.trim() !== '');
                const optionals = (values?.optionals || []).reduce(
                    (acc: { [key: string]: any }, item: { key: string; value: string }) => {
                        if (item.key) {
                            acc[item.key] = item.value || '';
                        }
                        return acc;
                    },
                    {}
                );

                let result;
                if (values.id) {
                    result = await updateVendorDetails({
                        ...values,
                        vendorEmail: emailsArray,
                        optionals,
                    });
                } else {
                    result = await handleVendorCreation({
                        ...values,
                        vendorEmail: emailsArray,
                        optionals,
                    });
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            validationSchema={vendorData}
            initialValues={{
                id: data?.id || '',
                vendorName: data?.vendorName || '',
                type: data?.type || '',
                apiUrl: data?.apiUrl || '',
                healthUrl: data?.healthUrl || '',
                state: data?.state || '',
                gstNo: data?.gstNo || '',
                address: data?.address || '',
                optional1: data?.optional1 || '',
                optional2: data?.optional2 || '',
                optional3: data?.optional3 || '',
                optional4: data?.optional4 || '',
                optional5: data?.optional5 || '',
                optional6: data?.optional6 || '',
                optionals: data?.optionals || [],
                vendorEmail: data?.vendorEmail?.join(',') || '',
            }}
        >
            {({ handleSubmit, values }) => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        <TextInput
                            name="vendorName"
                            label="Vendor Name"
                            type="text"
                            placeholder="Enter Vendor Name"
                            isRequired
                            classes=" rounded-sm"
                            maxLength={50}
                        />
                        <SelectInput
                            name="type"
                            label="Type"
                            placeholder="Please select type"
                            isRequired
                            classes="rounded-sm"
                            options={vendorTypes}
                            showSearch
                        />
                        <TextInput
                            name="apiUrl"
                            label="API URL"
                            type="text"
                            placeholder="https://www.example.com"
                            classes="rounded-sm"
                            isRequired
                        />
                        <TextInput
                            name="healthUrl"
                            label="Health URL"
                            type="text"
                            placeholder="Enter Health URL"
                            classes="rounded-sm"
                        />
                        <SelectInput
                            name="state"
                            label="State"
                            placeholder="Please select state"
                            classes="rounded-sm"
                            options={stateOptions}
                            showSearch
                        />
                        <TextInput
                            name="gstNo"
                            label="GST Number"
                            type="text"
                            placeholder="Enter 15-character GSTIN"
                            classes="rounded-sm"
                            maxLength={15}
                        />
                        <InputTextArea
                            name="address"
                            label="Address"
                            placeholder="Enter Vendor Address"
                        />
                        <TextInput
                            name="optional1"
                            label="Optional 1"
                            type="text"
                            classes="rounded-sm"
                        />
                        <TextInput
                            name="optional2"
                            label="Optional 2"
                            type="text"
                            classes="rounded-sm"
                        />
                        <TextInput
                            name="optional3"
                            label="Optional 3"
                            type="text"
                            classes="rounded-sm"
                        />
                        <TextInput
                            name="optional4"
                            label="Optional 4"
                            type="text"
                            classes="rounded-sm"
                        />
                        <TextInput
                            name="optional5"
                            label="Optional 5"
                            type="text"
                            classes="rounded-sm"
                        />
                        <TextInput
                            name="optional6"
                            label="Optional 6"
                            type="text"
                            classes="rounded-sm"
                        />
                        <InputTextArea
                            name="vendorEmail"
                            label="Vendor Email ID"
                            placeholder="Enter Vendor Email ID"
                            isRequired
                            showToolTip
                            tooltipText="Multiple Email IDs are seperated by commas"
                        />
                        <OptionalForm values={values.optionals} />
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default VendorModal;
