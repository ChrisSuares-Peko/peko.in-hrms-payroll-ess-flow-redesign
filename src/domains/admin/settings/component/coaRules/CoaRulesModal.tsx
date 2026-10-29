import { Flex, Form } from 'antd';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useCreateChartOfAccount from '../../hooks/useCreateChartOfAccount';
import useCreateRules from '../../hooks/useCreateRules';
import coaRulesSchema from '../../schema/coaRules';
import { refresh } from '../../types/accessCode';
import { COArules } from '../../types/coaRules';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: COArules;
};
const CoaRulesModal = ({ open, handleCancel, setRefresh, data }: ModalProps & refresh) => {
    const { isLoading, createNewRules, updateCurrentRules } = useCreateRules();
    const dispatch = useAppDispatch();
    const { tableData, parentData, isTypesLoading, isParentsLoading } = useCreateChartOfAccount();
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="COA Rules Management"
            open={open}
            validationSchema={coaRulesSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async value => {
                let res: boolean;
                if (data) {
                    res = await updateCurrentRules({
                        ...value,
                        id: data.id,
                    });
                } else {
                    res = await createNewRules({
                        ...value,
                    });
                }

                if (res === true) {
                    setRefresh(true);
                    dispatch(
                        showToast({
                            description: data
                                ? `COA rules updated successfully`
                                : `COA rules added successfully`,
                            variant: 'success',
                        })
                    );
                    handleCancel();
                }
            }}
            initialValues={{
                entityType: data?.entityType || '',
                accountType: data?.accountType || '',
                prefix: data?.prefix || '',
                parentAccId: data?.parentAccountId || '',
                description: data?.description || '',
                isSubAccount: Boolean(data?.parentAccountId),
            }}
        >
            {({ values, setFieldValue }) => {
                const selectedAccountType = tableData?.find(
                    item => item.value === values.accountType
                );

                const showSubAccountCheckbox = selectedAccountType?.isSubAccountAllowed;
                const showParentDropdown = values.isSubAccount === true;

                return (
                    <Flex vertical className="w-full">
                        <Form layout="vertical">
                            <TextInput
                                name="prefix"
                                label="Prefix"
                                type="text"
                                placeholder="Enter prefix"
                                isRequired
                                classes="rounded-sm"
                                maxLength={50}
                            />
                            <SelectInput
                                name="entityType"
                                isRequired
                                options={[
                                    { value: 'vendor', label: 'Vendor' },
                                    { value: 'partner', label: 'Partner' },
                                    { value: 'corporate', label: 'Corporate' },
                                ]}
                                placeholder="Please select a entity type"
                                label="Entity Type"
                            />
                            <SelectInputWithSearch
                                name="accountType"
                                isRequired
                                options={tableData || []}
                                placeholder="Please select a account type"
                                label="Account Type"
                                loading={isTypesLoading}
                                isDisabled={isTypesLoading}
                            />
                            {showSubAccountCheckbox && (
                                <CheckboxInput
                                    name="isSubAccount"
                                    onChange={e => setFieldValue('isSubAccount', e.target.checked)}
                                >
                                    Make this a sub-account
                                </CheckboxInput>
                            )}
                            {showParentDropdown && (
                                <SelectInputWithSearch
                                    name="parentAccId"
                                    isRequired
                                    options={
                                        parentData?.filter(
                                            acc => acc.accountType === values.accountType
                                        ) ?? []
                                    }
                                    placeholder="Please select a parent"
                                    label="Parent"
                                    loading={isParentsLoading}
                                    isDisabled={isParentsLoading}
                                />
                            )}
                            <InputTextArea
                                name="description"
                                label="Description"
                                placeholder="Enter Description"
                                isRequired
                                maxLength={700}
                            />
                        </Form>
                    </Flex>
                );
            }}
        </CustomModalWithForm>
    );
};

export default CoaRulesModal;
