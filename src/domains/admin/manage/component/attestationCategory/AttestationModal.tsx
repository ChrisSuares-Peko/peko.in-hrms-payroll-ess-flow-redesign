import { Flex, Form } from 'antd';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useGetCountries } from '../../hooks/Attestation/useGetCountries';
import useGetAttestationCategories from '../../hooks/useAttestationCategory';
import attestationCategorySchema from '../../schema/attestationCategorySchema';
import { AttestationCategoryData } from '../../types/attestationTypes';

type AttestationCategoryModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: AttestationCategoryData;
    setRefresh: (e: any) => void;
};

const AttestationCategoryModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: AttestationCategoryModalProps) => {
    const dispatch = useAppDispatch();
    const { countryData }: { countryData: { value: string; label: string }[] } = useGetCountries();
    const { createCategory, isLoading, updateCategory } = useGetAttestationCategories({});

    const handleFormSubmit = async (values: any) => {
        const selectedCountry = countryData.find(country => country.value === values.issuedCountry);

        if (!selectedCountry) {
            dispatch(
                showToast({
                    description: 'Please select a valid country.',
                    variant: 'error',
                })
            );
            return;
        }

        const payload = {
            ...values,
            countryCode: selectedCountry.value,
            country: selectedCountry.label,
        };

        let res: any;
        try {
            if (data) {
                res = await updateCategory(payload);
            } else {
                res = await createCategory(payload);
            }
            if (res?.status === true) {
                dispatch(
                    showToast({
                        description: `${res.message}`,
                        variant: 'success',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description: `${res?.message}`,
                        variant: 'error',
                    })
                );
            }
        } catch (error) {
            dispatch(
                showToast({
                    description: 'An error occurred while creating the category.',
                    variant: 'error',
                })
            );
        } finally {
            handleCancel();
            setRefresh(true); // Ensure that handleCancel is called after the async operation
        }
    };

    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle={data ? 'Edit Attestation Category' : 'Add Attestation Category'}
            open={open}
            validationSchema={attestationCategorySchema}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={{
                id: data?.id || '',
                issuedCountry: data?.countryCode || '',
                label: data?.label || '',
                value: data?.value || '',
                price: data?.price || '',
            }}
        >
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <SelectInputWithSearch
                        name="issuedCountry"
                        placeholder="Select Issued Country"
                        label="Document Issued Country"
                        options={countryData}
                        isRequired
                    />
                    <TextInput
                        name="label"
                        label="Label"
                        type="text"
                        placeholder="Enter label"
                        isRequired
                    />
                    <TextInput
                        name="value"
                        label="Value"
                        type="text"
                        placeholder="Enter value"
                        isRequired
                    />
                    <TextInput
                        name="price"
                        label="Price"
                        type="text"
                        placeholder="Enter price"
                        isRequired
                        allowNumbersOnly
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default AttestationCategoryModal;
