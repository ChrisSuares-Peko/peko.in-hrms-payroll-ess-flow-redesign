import React, { useEffect, useRef, useState } from 'react';

import { Flex, Form, Typography } from 'antd';
import { FormikProps } from 'formik';
import { IoCheckmark, IoClose } from 'react-icons/io5';

import PasswordInput from '@components/atomic/inputs/PasswordInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppSelector } from '@src/hooks/store';

import useManageBasicInfo from '../hooks/useManageBasicInfo';
import { changePasswordSchema } from '../schema';

interface ChangerPasswordModalProps {
    open: boolean;
    handleCancel: () => void;
    validatePassword: (password: string) => string[];
}

const ChangerPasswordModal = ({
    open,
    handleCancel,
    validatePassword,
}: ChangerPasswordModalProps) => {
    const { handleChangeUserPassword, isEditLoading } = useManageBasicInfo({ handleCancel });
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const changePassForm = useRef<FormikProps<any>>(null);
    // const [passwordVisible1, setPasswordVisible1] = React.useState(false);
    // const [passwordVisible2, setPasswordVisible2] = React.useState(false);
    // const [passwordVisible3, setPasswordVisible3] = React.useState(false);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        const validationErrors = validatePassword(password);
        setErrors(validationErrors);
    }, [password, validatePassword]);

    useEffect(() => {
        if (!open) {
            setPassword('');
            setConfirmPassword('');
        }
    }, [open]);

    const handlePasswordChange = (e: any) => {
        setPassword(e.target.value);
    };

    const handleConfirmChange = (e: any) => {
        setConfirmPassword(e.target.value);
    };
    return (
        <CustomModalWithForm
            modalTitle="Change Password"
            open={open}
            isDisabled={errors.length > 0}
            isLoading={isEditLoading}
            handleCancel={handleCancel}
            initialValues={{ oldPassword: '', newPassword: '', confirmPassword: '' }}
            validationSchema={changePasswordSchema}
            handleFormSubmit={async values => {
                const resp = await handleChangeUserPassword({
                    oldPassword: values.oldPassword,
                    newPassword: values.newPassword,
                    id: id.toString(),
                    userType: role,
                    userId: id,
                });
                if (resp) {
                    changePassForm.current?.resetForm();
                }
            }}
            // formRefName={changePassForm}
            reinitialise
            maskClosable
        >
            <Flex vertical className="mt-6 w-full">
                <Form layout="vertical">
                    <PasswordInput
                        name="oldPassword"
                        label="Current Password"
                        placeholder="Enter Current Password"
                        type="password"
                        size="large"
                        isRequired
                    />
                    {/* <TextInput
                        name="oldPassword"
                        label="Current Password"
                        placeholder="Enter Current Password"
                        isRequired
                        classes=" rounded-sm"
                        type={passwordVisible1 ? 'text' : 'password'}
                        suffix={
                            passwordVisible1 ? (
                                <EyeTwoTone
                                    onClick={() => setPasswordVisible1(prevState => !prevState)}
                                />
                            ) : (
                                <EyeInvisibleOutlined
                                    onClick={() => setPasswordVisible1(prevState => !prevState)}
                                />
                            )
                        }
                    /> */}
                    <PasswordInput
                        name="newPassword"
                        label="New Password"
                        placeholder="Enter New Password"
                        type="password"
                        size="large"
                        isRequired
                        onChange={handlePasswordChange}
                    />
                    {/* <TextInput
                        name="newPassword"
                        label="New Password"
                        placeholder="Enter New Password"
                        classes=" rounded-sm"
                        isRequired
                        showToolTip
                        tooltipText="Enter minimum 8 characters password"
                        type={passwordVisible2 ? 'text' : 'password'}
                        suffix={
                            passwordVisible2 ? (
                                <EyeTwoTone
                                    onClick={() => setPasswordVisible2(prevState => !prevState)}
                                />
                            ) : (
                                <EyeInvisibleOutlined
                                    onClick={() => setPasswordVisible2(prevState => !prevState)}
                                />
                            )
                        }
                    /> */}
                    <PasswordInput
                        name="confirmPassword"
                        label="Confirm Password"
                        placeholder="Confirm New Password"
                        type="password"
                        size="large"
                        isRequired
                        onChange={handleConfirmChange}
                    />
                    {/* <TextInput
                        name="confirmPassword"
                        label="Confirm Password"
                        placeholder="Confirm New Password"
                        isRequired
                        classes=" rounded-sm"
                        type={passwordVisible3 ? 'text' : 'password'}
                        suffix={
                            passwordVisible3 ? (
                                <EyeTwoTone
                                    onClick={() => setPasswordVisible3(prevState => !prevState)}
                                />
                            ) : (
                                <EyeInvisibleOutlined
                                    onClick={() => setPasswordVisible3(prevState => !prevState)}
                                />
                            )
                        }
                    /> */}
                    <Flex vertical gap={8}>
                        {errors.length === 0 &&
                        (!confirmPassword || confirmPassword === password) ? (
                            <Flex align="center" gap={1}>
                                <IoCheckmark color="#05BE63" />
                                <Typography.Text style={{ color: '#05BE63' }}>
                                    Password is valid.
                                </Typography.Text>
                            </Flex>
                        ) : (
                            errors.map((error, index = 1) => (
                                <Flex key={index} align="baseline" gap={1}>
                                    <Flex>
                                        <IoClose className="pt-1" size={15} color="#E01A1A" />
                                    </Flex>
                                    <Typography.Text style={{ color: '#E01A1A' }}>
                                        <>{error}</>
                                    </Typography.Text>
                                </Flex>
                            ))
                        )}
                    </Flex>
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default ChangerPasswordModal;
