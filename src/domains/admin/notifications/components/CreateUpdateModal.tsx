import { useState } from 'react';

import { Flex, Form } from 'antd';

// import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useNotificationUpdate from '../hooks/useNotificationUpdate';
import { notificationSchema } from '../schema/index';
import { NotificationData } from '../types/index';
import { categoriesNotifications, defaultNotificationTo } from '../utils/index';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: NotificationData;
    handleRefresh: () => void;
};

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const [specificCorporate, setSpecificCorporate] = useState(
        data ? data?.notificationTo !== 'ALL' : false
    );
    const { isLoading, handleNotificationCreation, updateNotificationDetails, corporates } =
        useNotificationUpdate();
    const dispatch = useAppDispatch();

    return (
        <CustomModalWithForm
            modalTitle="Notification Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async (values, { resetForm }) => {
                let result: any;
                if (values.id) {
                    delete values.selCorporate;
                    result = await updateNotificationDetails(values);
                } else {
                    delete values.id;
                    delete values.selCorporate;
                    result = await handleNotificationCreation(values);
                }
                if (result.status === true) {
                    let description = '';
                    if (values.id) {
                        description = 'Notification updated successfully';
                    } else {
                        description = 'Notification created successfully';
                    }
                    dispatch(
                        showToast({
                            description,
                            variant: 'success',
                        })
                    );
                    handleCancel();
                    resetForm();
                    handleRefresh();
                } else {
                    dispatch(
                        showToast({
                            description: `${result?.message} `,
                            variant: 'error',
                        })
                    );
                }
            }}
            validationSchema={notificationSchema}
            initialValues={{
                id: data?.id || '',
                notificationTitle: data?.notificationTitle || '',
                notificationBrief: data?.notificationBrief || '',
                notificationCategory: data?.notificationCategory || '',
                notificationTo: data?.notificationTo || '',
                selCorporate: data?.notificationTo !== 'ALL',
            }}
        >
            <Flex vertical className="w-full ">
                <Form layout="vertical">
                    <TextInput
                        name="notificationTitle"
                        label="Notification Title"
                        type="text"
                        placeholder="Enter Notification Title"
                        isRequired
                        classes=" rounded-sm"
                        maxLength={30}
                    />
                    <TextInput
                        name="notificationBrief"
                        label="Notification Brief"
                        type="text"
                        placeholder="Enter Notification Brief"
                        isRequired
                        classes="rounded-sm"
                        maxLength={120}
                    />

                    <CustomSelectSearch
                        name="notificationCategory"
                        label="Category"
                        options={categoriesNotifications}
                        isRequired
                        placeholder="Select Category"
                    />
                    <CheckboxInput
                        onChange={e => setSpecificCorporate(e.target.checked)}
                        name="selCorporate"
                        checked={specificCorporate}
                    >
                        Any Specific Corporate
                    </CheckboxInput>
                    <CustomSelectSearch
                        name="notificationTo"
                        label="Notification To"
                        options={specificCorporate ? corporates : defaultNotificationTo}
                        isRequired
                        placeholder="Select Corporate"
                        isDisabled={!specificCorporate}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
