import { Flex, Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { refresh } from '@src/domains/admin/settings/types/disabledTypes';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import UseUpdateProfile from '../hooks/UseUpdateProfile';
import editProfileData from '../schema/editProfileData';
import { UserData } from '../types/index';

type Props = {
    open: boolean;
    handleCancel: () => void;
    data: UserData | undefined;
};

const EditProfileModal = ({ open, handleCancel, data, setRefresh }: Props & refresh) => {
    const dispatch = useAppDispatch();
    const { updateUserProfile } = UseUpdateProfile();
    return (
        <CustomModalWithForm
            modalTitle="Profile Management"
            open={open}
            validationSchema={editProfileData}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const payload = {
                    ...values,
                    username: data?.['credential.username'], // Add the username from the provided data
                };
                const res: boolean = await updateUserProfile(payload);

                if (res === true) {
                    setRefresh(true);

                    dispatch(
                        showToast({
                            description: `Profile updated successfully`,
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
                id: data?.id,
                mobileNo: data?.mobileNo || '',
                email: data?.email || '',
            }}
        >
            <Flex vertical className=" w-full">
                <Form layout="vertical">
                    <TextInput
                        allowNumbersOnly
                        name="mobileNo"
                        maxLength={10}
                        label="Mobile Number"
                        type="text"
                        placeholder="Please enter your mobile number "
                        isRequired
                        classes=" rounded-sm"
                    />
                    <TextInput
                        name="email"
                        label="Email ID"
                        type="text"
                        placeholder="Please enter your email address"
                        isRequired
                        classes=" rounded-sm"
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default EditProfileModal;
