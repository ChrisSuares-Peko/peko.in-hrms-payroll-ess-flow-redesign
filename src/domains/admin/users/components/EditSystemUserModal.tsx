import { Flex, Form, Skeleton } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { refresh } from '../../officeSupplies/types/products';
import usePartnersForCorporate from '../hooks/usePartnersForCorporate';
import useUpdateSystemUser from '../hooks/useUpdateSystemUser';
import systemUserSchema from '../schema/systemUser';
import { User } from '../types/systemUserTypes';

type EditUserProps = {
    open: boolean;
    handleCancel: () => void;
    data?: User;
};

const EditSystemUserModal = ({ open, handleCancel, data, setRefresh }: EditUserProps & refresh) => {
    const { categoryDatas } = usePartnersForCorporate('');
    const { roleData, updateSystemUser, createSystemUser } = useUpdateSystemUser();
    const dispatch = useAppDispatch();
    const initialValues = {
        id: data?.credentialId || '',
        name: data?.credential.name || '',
        username: data?.credential.username || '',
        email: data?.email || '',
        mobileNo: data?.mobileNo || '',
        registeredBy: Number(data?.registeredBy) || null,
        roleAndPermissionId: data?.roleAndPermissionId || '',
        portalUrl: data?.portalUrl || '',
        passwordProtection: data?.credential?.passwordProtection !== 0,
    };
    return (
        <CustomModalWithForm
            modalTitle="System User Management"
            open={open}
            reinitialise
            validationSchema={systemUserSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: any;
                if (data) {
                    res = await updateSystemUser({
                        ...values,
                    });
                } else {
                    res = await createSystemUser({
                        ...values,
                    });
                }
                if (res.status === true) {
                    setRefresh(true);
                    if (data)
                        dispatch(
                            showToast({
                                description: res.message,
                                variant: 'success',
                            })
                        );
                    else
                        dispatch(
                            showToast({
                                description: res.message,
                                variant: 'success',
                            })
                        );
                    handleCancel();
                }
                if (res.status === false) {
                    dispatch(
                        showToast({
                            description: `${res.message}`,
                            variant: 'error',
                        })
                    );
                }
            }}
            initialValues={initialValues}
        >
            <Flex vertical className="w-full ">
                <Form layout="vertical">
                    <TextInput
                        name="name"
                        label="Name"
                        type="text"
                        placeholder=""
                        isRequired
                        classes=" rounded-sm"
                        maxLength={50}
                    />
                    <TextInput
                        name="username"
                        label="Username"
                        type="text"
                        placeholder=""
                        isRequired
                        classes=" rounded-sm"
                        maxLength={50}
                    />
                    {roleData ? (
                        <SelectInputWithSearch
                            isRequired
                            name="roleAndPermissionId"
                            options={roleData}
                            placeholder="please select a role"
                            label="Role"
                        />
                    ) : (
                        <Skeleton.Input active block />
                    )}
                    <TextInput
                        name="email"
                        label="Email ID"
                        type="text"
                        placeholder=""
                        isRequired
                        classes=" rounded-sm"
                        maxLength={50}
                    />
                    <TextInput
                        name="mobileNo"
                        label="Mobile Number (Optional)"
                        type="text"
                        placeholder=""
                        classes=" rounded-sm"
                        allowNumbersOnly
                        minLength={9}
                        maxLength={10}
                    />
                    {categoryDatas ? (
                        <SelectInput
                            name="registeredBy"
                            options={(categoryDatas || []).map(d => ({
                                value: d.id,
                                label: d.name,
                            }))}
                            placeholder=""
                            label="Partner (optional)"
                            allowClear
                        />
                    ) : (
                        <Skeleton.Input active block />
                    )}
                    <TextInput
                        name="portalUrl"
                        label="Portal URL (Optional)"
                        type="text"
                        placeholder=""
                        classes=" rounded-sm"
                        maxLength={50}
                    />
                    {data && (
                        <SwitchInput label="Enable Password Protection" name="passwordProtection" />
                    )}
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default EditSystemUserModal;
