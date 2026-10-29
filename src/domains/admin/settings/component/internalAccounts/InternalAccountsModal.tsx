import { useMemo } from 'react';

import { Flex, Form } from 'antd';

import MultiSelectInput from '@components/atomic/inputs/MultiSelectInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useAddInternalAccounts from '../../hooks/internalAccounts/useAddInternalAccounts';
import internalAccountsSchema from '../../schema/internalAccountsSchema';
import { InternalAccount } from '../../types/internalAccountsTypes';

type Props = {
    open: boolean;
    data: InternalAccount[];
    handleCancel: () => void;
    handleRefresh: () => void;
};

const InternalAccountsModal = ({ open, handleCancel, handleRefresh, data }: Props) => {
    const { isLoading, allAccounts, createInternalAccounts } = useAddInternalAccounts();
    const dispatch = useAppDispatch();

    const options = useMemo(() => {
        const existingIds = new Set(data.map(item => item.id));
        return allAccounts
            .filter(acc => !existingIds.has(acc.id))
            .map(acc => ({
                label: `${acc.name} - ${acc.username}`,
                value: acc.id,
            }));
    }, [allAccounts, data]);

    return (
        <CustomModalWithForm
            modalTitle="Internal Account Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const result = await createInternalAccounts({
                    accounts: values.accounts,
                });
                if (result) {
                    dispatch(
                        showToast({
                            description: `Account added successfully`,
                            variant: 'success',
                        })
                    );
                    handleCancel();
                    handleRefresh();
                } else {
                    dispatch(
                        showToast({
                            description: `Something went wrong, please try again later`,
                            variant: 'error',
                        })
                    );
                }
            }}
            validationSchema={internalAccountsSchema}
            initialValues={{
                accounts: [],
            }}
        >
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <MultiSelectInput
                        name="accounts"
                        label="Internal Accounts"
                        placeholder="Please select internal accounts"
                        isRequired
                        classes="rounded-sm"
                        options={options}
                        filterOption
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default InternalAccountsModal;
