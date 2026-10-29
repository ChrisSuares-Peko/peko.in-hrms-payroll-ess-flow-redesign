import { Flex, Form } from 'antd';

import PasswordInput from '@components/atomic/inputs/PasswordInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { refresh } from '@src/domains/admin/settings/types/disabledTypes';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import UseUpdateProfile from '../hooks/UseUpdateProfile';
import editPassword from '../schema/editPassword';

type Props = {
    open: boolean;
    handleCancel: () => void;
};

const EditPassword = ({ open, handleCancel, setRefresh }: Props & refresh) => {
    const dispatch = useAppDispatch();
    const { updateUserPassword } = UseUpdateProfile();
    return (
        <CustomModalWithForm
            modalTitle="Password Management"
            open={open}
            validationSchema={editPassword}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const res: boolean = await updateUserPassword(values);

                if (res === true) {
                    setRefresh(true);

                    dispatch(
                        showToast({
                            description: `Password updated successfully`,
                            variant: 'success',
                        })
                    );
                }
                if (res === false) {
                    return;
                }
                handleCancel();
            }}
            initialValues={{
                oldPassword: '',
                newPassword: '',
                ConfirmPassword: '',
            }}
        >
            <Flex vertical className=" w-full">
                <Form layout="vertical">
                    <PasswordInput
                        name="oldPassword"
                        label="Current Password"
                        type="password"
                        placeholder="Please enter your old password "
                        isRequired
                        classes=" rounded-sm"
                    />
                    <PasswordInput
                        name="newPassword"
                        label="New Password"
                        type="password"
                        placeholder="Please enter your new password "
                        isRequired
                        classes=" rounded-sm"
                    />
                    <PasswordInput
                        name="ConfirmPassword"
                        label="Confirm Password"
                        type="password"
                        placeholder="Please confirm your password "
                        isRequired
                        classes=" rounded-sm"
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default EditPassword;
