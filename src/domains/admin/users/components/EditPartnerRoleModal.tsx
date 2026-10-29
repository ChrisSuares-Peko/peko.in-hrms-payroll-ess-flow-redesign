import React, { Fragment } from 'react';

import { Button, Col, Flex, Modal, Row, Skeleton, Typography, Form } from 'antd';
import { Formik } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import SwitchInput from '@domains/admin/settings/component/partnerPermission/SwitchInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { toTitleCase } from '@utils/wordFormat';

import { refresh } from '../../officeSupplies/types/products';
import useUpdateRoles from '../../settings/hooks/useUpdateRoles';
import { Permission } from '../../settings/types/partnerPermission';
import { mergeSavedPermissions } from '../../settings/utils/mergePartnerPermissions';
import useGeneralApi from '../hooks/useGeneralApi';
import usePartnerRoleData from '../hooks/usePartnerRoleData';
import partnerRolesSchema from '../schema/partnerRolesSchema';

type RoleModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
};
const EditPartnerRoleModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: RoleModalProps & refresh) => {
    const dispatch = useAppDispatch();
    const { permissionData, isloading } = useUpdateRoles();
    const { createPartnerRole, updatePartnerRole } = usePartnerRoleData();
    const { stateData } = useGeneralApi();
    // Saving this form replaces the partner's whole permission tree, so the merge must
    // keep the icon / alias / More Services flag / order set in Partner Permissions —
    // copying only `hasAccess` here is what wiped them for non-default partners.
    const updatedMockService: Permission[] = React.useMemo(() => {
        if (!permissionData) return [];
        return mergeSavedPermissions(permissionData, data?.permissions?.permissions);
    }, [permissionData, data]);
    const id = data && data.length > 0 ? data?.id : null;
    return (
        <Formik
            initialValues={{
                id: id || '',
                registeredBy: data?.registeredBy ? Number(data?.registeredBy) : data?.registeredBy,
                permissions: updatedMockService,
                name: data?.credential.name || '',
                username: data?.credential.username || '',
                email: data?.email || '',
                mobileNo: data?.mobileNo || '',
                portalUrl: data?.portalUrl || '',
                state: data?.state || '',
                enforcePrivacyPolicy:Boolean(data?.credential.enforcePrivacyPolicy)
            }}
            validationSchema={partnerRolesSchema}
            onSubmit={async values => {
                const payload = {
                    permissions: values.permissions || null,
                    userDetails: {
                        name: values.name || 0,
                        username: values?.username || '',
                        email: values?.email || '',
                        mobileNo: values?.mobileNo || '',
                        portalUrl: values?.portalUrl || '',
                        state: values?.state || '',
                         enforcePrivacyPolicy:values?.enforcePrivacyPolicy
                    },
                };
                // const res = await createPartnerRole(payload);
                let res: any;
                if (data?.id) {
                 
                    res = await updatePartnerRole(data.credentialId, payload); // Pass the id for updating
                } else {
                    // Create action
                    res = await createPartnerRole(payload);
                }
                if (res && res.status === true) {
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
                if (res && res.status === false) {
                    dispatch(
                        showToast({
                            description: `${res.message}`,
                            variant: 'error',
                        })
                    );
                }
            }}
            enableReinitialize
        >
            {({ values, handleSubmit, setFieldValue }) => {
                const onClickSubmit: React.MouseEventHandler<HTMLElement> = e => {
                    e.preventDefault();
                    handleSubmit();
                };
                const updateParentAccess = (permissions: Permission[], index: number) =>
                    permissions?.map((permission, i) => {
                        if (i === index) {
                            if (permission.subServices && permission.subServices.length > 0) {
                                // Check if any subService hasAccess is true
                                const anySubServiceAccess = permission.subServices.some(
                                    subService => subService.hasAccess
                                );

                                // Set parent's hasAccess based on subServices
                                permission.hasAccess = anySubServiceAccess;
                                return setFieldValue(
                                    `permissions[${index}].hasAccess`,
                                    permission.hasAccess
                                );
                            }
                        }
                        return permission;
                    });
                const disablePermissionAndSubServices = (
                    permissions: Permission[],
                    index: number
                ) =>
                    permissions?.map((permission, i) => {
                        if (i === index) {
                            // Set the permission's `hasAccess` to false
                            permission.hasAccess = false;

                            // If there are subServices, update their `hasAccess` as well
                            if (permission.subServices && permission.subServices.length > 0) {
                                const subService = permission.subServices?.map(item => {
                                    if (item.hasAccess) {
                                        return { ...item, hasAccess: false };
                                    }
                                    return item;
                                });
                                // Update the subServices in the form state
                                setFieldValue(`permissions[${index}].subServices`, subService);
                            }

                            // Update the permission's `hasAccess` in the form state
                            return setFieldValue(
                                `permissions[${index}].hasAccess`,
                                permission.hasAccess
                            );
                        }
                        return permission;
                    });
                return (
                    <Modal
                        width={1000}
                        centered
                        title={data?.id ? 'Edit New Partner' : 'Add New Partner'}
                        footer={[
                            <Flex className="w-full " justify="flex-end" gap={10} key="">
                                <Button
                                    key="submit"
                                    type="primary"
                                    danger
                                    loading={isloading}
                                    onClick={onClickSubmit}
                                    className="px-5"
                                >
                                    Submit
                                </Button>
                                <Button
                                    key="back"
                                    onClick={() => {
                                        handleCancel();
                                    }}
                                    className="px-5"
                                >
                                    Cancel
                                </Button>
                            </Flex>,
                        ]}
                        open={open}
                        onCancel={handleCancel}
                    >
                        <Form layout="vertical">
                            {updatedMockService.length > 0 ? (
                                <>
                                    <Row gutter={[20, 10]}>
                                        {/* Existing Partner Dropdown */}
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name="name"
                                                label="Name"
                                                type="text"
                                                placeholder=""
                                                isRequired
                                                classes=" rounded-sm"
                                                maxLength={50}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name="username"
                                                label="Username"
                                                type="text"
                                                placeholder=""
                                                isRequired
                                                classes=" rounded-sm"
                                                maxLength={50}
                                            />
                                        </Col>

                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name="email"
                                                label="Email ID"
                                                type="text"
                                                placeholder=""
                                                isRequired
                                                classes=" rounded-sm"
                                                maxLength={50}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name="mobileNo"
                                                label="Mobile Number (Optional)"
                                                type="text"
                                                placeholder=""
                                                classes=" rounded-sm"
                                                allowNumbersOnly
                                                minLength={10}
                                                maxLength={10}
                                            />
                                        </Col>

                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name="portalUrl"
                                                label="Portal URL (Optional)"
                                                type="text"
                                                placeholder=""
                                                classes=" rounded-sm"
                                                maxLength={50}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <SelectInput
                                                name="state"
                                                label="State"
                                                placeholder="Please select state"
                                                classes="rounded-sm"
                                                options={stateData || []}
                                                showSearch
                                            />
                                        </Col>
                                            <Col xs={24} sm={8}>
                                        {/* <Typography.Text className="font-normal">
                                            Privacy Policy
                                        </Typography.Text> */}
                                        <Flex className="mt-10" align="center">
                                        <SwitchInput
                                            name="enforcePrivacyPolicy"
                                            classes=''
                                            label="Enforce Privacy Policy"
                                            labelClasses="text-sm font-normal"
                                            onChange={checked =>
                                                setFieldValue('enforcePrivacyPolicy', checked)
                                            }
                                        />
                                        </Flex>
                                    </Col>
                                    </Row>

                                    {/* {categoryDatas ? (
                                        <SelectInput
                                            name="registeredBy"
                                            options={(categoryDatas || []).map(d => ({
                                                value: d.id,
                                                label: d.name,
                                            }))}
                                            placeholder=""
                                            label="Partner"
                                           // handleChange={(value) => handlePartnerChange(value)}
                                            allowClear
                                        />
                                    ) : (
                                        <Skeleton.Input active block />
                                    )} */}

                                    <Typography.Title level={5} className="pb-5">
                                        Permissions
                                    </Typography.Title>
                                    {values.permissions?.map(
                                        (permission, index) => (
                                                <div key={index}>
                                                    <SwitchInput
                                                        labelClasses="text-sm text-end font-normal"
                                                        name={`permissions[${index}].hasAccess`}
                                                        label={toTitleCase(permission.label)}
                                                        onChange={checked => {
                                                            if (
                                                                (permission.subServices?.length ?? 0) > 0
                                                            ) {
                                                                const updatedVal =
                                                                    values.permissions[
                                                                        index
                                                                    ].subServices?.some(
                                                                        subService =>
                                                                            subService.hasAccess
                                                                    ) ?? false;
                                                                if (!checked) {
                                                                    disablePermissionAndSubServices(
                                                                        values.permissions,
                                                                        index
                                                                    );
                                                                }
                                                                if (!updatedVal && checked) {
                                                                    setFieldValue(
                                                                        `permissions[${index}].hasAccess`,
                                                                        false
                                                                    );
                                                                    dispatch(
                                                                        showToast({
                                                                            description:
                                                                                'Please enable at least one sub-service to activate this service',
                                                                            variant: 'warning',
                                                                        })
                                                                    );
                                                                } else {
                                                                    setFieldValue(
                                                                        `permissions[${index}].hasAccess`,
                                                                        checked
                                                                    );
                                                                }
                                                            } else {
                                                                setFieldValue(
                                                                    `permissions[${index}].hasAccess`,
                                                                    checked
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Row>
                                                        {permission?.subServices?.map(
                                                            (service, serviceIndex) => (
                                                                <Col
                                                                    xs={24}
                                                                    sm={12}
                                                                    md={6}
                                                                    key={serviceIndex}
                                                                >
                                                                    <CheckboxInput
                                                                        key={serviceIndex}
                                                                        name={`permissions[${index}].subServices[${serviceIndex}].hasAccess`}
                                                                        children={
                                                                            <Typography.Text>
                                                                                {toTitleCase(
                                                                                    service.label
                                                                                )}
                                                                            </Typography.Text>
                                                                        }
                                                                        onChange={checked => {
                                                                            // Update the form values
                                                                            const updatedVal =
                                                                                values.permissions;
                                                                            updatedVal[
                                                                                index
                                                                            ].subServices![
                                                                                serviceIndex
                                                                            ].hasAccess =
                                                                                checked.target.checked;
                                                                            updateParentAccess(
                                                                                values.permissions,
                                                                                index
                                                                            );
                                                                        }}
                                                                        isRequired
                                                                    />
                                                                </Col>
                                                            )
                                                        )}
                                                    </Row>
                                                </div>
                                            )
                                    )}
                                </>
                            ) : (
                                <Skeleton active paragraph={{ rows: 10 }} />
                            )}
                        </Form>
                    </Modal>
                );
            }}
        </Formik>
    );
};

export default EditPartnerRoleModal;
