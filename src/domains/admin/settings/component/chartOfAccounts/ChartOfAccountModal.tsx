import { Flex, Form } from 'antd';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import UseCreateChartofAccounts from '../../hooks/useCreateChartOfAccount';
import chartOfAccountSchema from '../../schema/chartOfAccountSchema';
import { refresh } from '../../types/accessCode';
import { ChartofAccount } from '../../types/chartofAccount';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: ChartofAccount;
    initialName?: string;
};

const ChartOfAccountModal = ({
    open,
    handleCancel,
    setRefresh,
    data,
    initialName = '',
}: ModalProps & refresh) => {
    const {
        isLoading,
        isTypesLoading,
        isParentsLoading,
        createNewChartofAccount,
        updateCurrentChartOfAccount,
        tableData,
        parentData,
    } = UseCreateChartofAccounts();
    const dispatch = useAppDispatch();

    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Chart of Account Management"
            open={open}
            validationSchema={chartOfAccountSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async value => {
                const res = data
                    ? await updateCurrentChartOfAccount({ ...value, id: data.id })
                    : await createNewChartofAccount({ ...value });

                if (res.success) {
                    const isPending = res.syncStatus?.includes('PENDING');
                    setRefresh(true);
                    dispatch(
                        showToast({
                            description:
                                res.message ||
                                (data
                                    ? 'Chart of account updated successfully'
                                    : 'Chart of account added successfully'),
                            variant: isPending ? 'warning' : 'success',
                        })
                    );
                    handleCancel();
                }
            }}
            initialValues={{
                accountName: data?.account_name || initialName,
                accountType: data?.account_type || '',
                accountCode: data?.account_code || '',
                description: data?.description || '',
                parentAccId: data?.parent_account_id || '',
                isSubAccount: !!data?.parent_account_id,
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
                                name="accountName"
                                label="Account Name"
                                type="text"
                                placeholder="Enter account name"
                                isRequired
                                classes="rounded-sm"
                            />
                            <SelectInputWithSearch
                                name="accountType"
                                isRequired
                                options={tableData || []}
                                placeholder="Please select an account type"
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
                            <TextInput
                                allowNumbersOnly
                                name="accountCode"
                                label="Account Code"
                                type="text"
                                maxLength={12}
                                placeholder="Please enter account code"
                                classes="rounded-sm"
                            />
                            <InputTextArea
                                name="description"
                                label="Description"
                                placeholder="Enter description"
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

export default ChartOfAccountModal;
