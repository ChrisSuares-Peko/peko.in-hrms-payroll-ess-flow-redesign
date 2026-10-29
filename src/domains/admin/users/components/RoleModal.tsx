import React, { Fragment, useState } from 'react';

import { Button, Flex, Modal, Skeleton, Table, Typography } from 'antd';
import { Formik } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { refresh } from '../../officeSupplies/types/products';
import useUpdateRoles from '../hooks/useUpdateRoles';
import rolesSchema from '../schema/roles';
import { Permission, Role } from '../types/systemUserTypes';

type RoleModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Role;
    accessPermission?: any;
};
const RoleModal = ({ open, handleCancel, data, setRefresh, accessPermission }: RoleModalProps & refresh) => {
    const dispatch = useAppDispatch();
    const { permissionData, updateRoleApi, createNewRoles, isloading } = useUpdateRoles();
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
    const updateMockService = (mockServices: Permission[], existingServices: Permission[]) =>
        mockServices
            .filter(mockServiceCategory => mockServiceCategory.serviceCategory !== 'Profile')
            .map(mockServiceCategory => {
                const matchingExistingCategory = existingServices.find(
                    existingServiceCategory =>
                        existingServiceCategory.serviceCategory ===
                        mockServiceCategory.serviceCategory
                );

                if (matchingExistingCategory) {
                    mockServiceCategory.hasAccess = matchingExistingCategory.hasAccess;

                    // Start with saved services as the base, then append any new sub-categories from template
                    const mergedSubCategories = [...matchingExistingCategory.services];

                    (mockServiceCategory.services || []).forEach(mockSubCategory => {
                        const savedSubCategory = mergedSubCategories.find(
                            s => s.category === mockSubCategory.category
                        );

                        if (!savedSubCategory) {
                            // New sub-category not in saved role — append it with template defaults
                            mergedSubCategories.push(mockSubCategory);
                        } else {
                            // Sub-category exists — append any new individual services missing from saved data
                            (mockSubCategory.services || []).forEach(mockService => {
                                const serviceExists = savedSubCategory.services?.find(
                                    (s: any) => s.service === mockService.service
                                );
                                if (!serviceExists) {
                                    savedSubCategory.services = [
                                        ...(savedSubCategory.services || []),
                                        mockService,
                                    ];
                                }
                            });
                        }
                    });

                    mockServiceCategory.services = mergedSubCategories;
                }

                return mockServiceCategory;
            });

    let updatedMockService: Permission[] = [];
    if (data && permissionData) {
        updatedMockService = updateMockService(permissionData, data.permissions);
    } else if (permissionData) {
        updatedMockService = permissionData.filter(
            service => service.serviceCategory !== 'Profile'
        );
    }
    const handleExpand = (expanded: boolean, record: any) => {
        setExpandedRowKeys(prevKeys =>
            expanded
                ? [...prevKeys, record.recordIndex]
                : prevKeys.filter(key => key !== record.recordIndex)
        );
    };
  
    return (
        <Formik
            initialValues={{
                id: data?.id,
                roleName: data?.roleName,
                permissions: updatedMockService,
            }}
            onSubmit={async values => {
                let res: any;
                if (data) {
                    res = await updateRoleApi({
                        ...values,
                    });
                } else {
                    res = await createNewRoles({
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
            validationSchema={rolesSchema}
            enableReinitialize
        >
            {({ values, handleSubmit,setFieldValue }) => {
                const onClickSubmit: React.MouseEventHandler<HTMLElement> = e => {
                    e.preventDefault();
                    handleSubmit();
                };
                const columns = [
                    {
                        title: 'Feature or Service',
                        dataIndex: 'serviceCategory',
                        key: 'serviceCategory',
                    },
                    {
                        title: 'Active Status',
                        dataIndex: 'hasAccess',
                        key: 'hasAccess',
                        render: (_: any, record: any, index: any) => (
                            <div style={{ width: 0 }}>
                                <SwitchInput
                                    name={`permissions[${index}].hasAccess`}
                                    // checked={record.hasAccess}
                                    onChange={checked => {
                                        setFieldValue(`permissions[${index}].hasAccess`, checked);
                                        // Enabling a main service must leave it with at least one
                                        // subservice on, otherwise the role grants an empty service
                                        // and the user lands on an access-denied/blank page.
                                        if (checked) {
                                            const subServices =
                                                values.permissions[index]?.services;
                                            if (
                                                subServices?.length &&
                                                !subServices.some(sub => sub.hasAccess)
                                            ) {
                                                setFieldValue(
                                                    `permissions[${index}].services[0].hasAccess`,
                                                    true
                                                );
                                            }
                                        }
                                    }}
                                />
                            </div>
                        ),
                    },

                    {
                        title: 'Permissions',
                        key: 'permissions',
                    },
                ];
                return (
                    <Modal
                        width={1000}
                        centered
                        title="Add Roles & Permissions"
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
                        {updatedMockService.length > 0 ? (
                            <>
                                <TextInput
                                    isRequired
                                    name="roleName"
                                    label="Role Name"
                                    type="text"
                                    placeholder="Enter role name"
                                    classes="rounded-sm"
                                />
                                <Typography.Title level={5} className="pb-5">
                                    Permissions
                                </Typography.Title>
                                <Table
                                    rowKey="recordIndex"
                                    columns={columns}
                                    dataSource={values.permissions.map((record, index) => ({
                                        ...record,
                                        recordIndex: index,
                                    }))}
                                    pagination={false}
                                    expandable={{
                                        expandedRowKeys,
                                        onExpand: handleExpand,
                                        expandedRowRender: (record, index) =>
                                           record.services?.map((subCategory, subIndex) => (
                                                // <Fragment key={subIndex}>
                                                <div key={record.recordIndex}>
                                                    {/* <Typography.Text>{subCategory.category}</Typography.Text> */}

                                                    {/* Align Text and SwitchInput */}
                                                    <Flex align="center" gap={8}>
                                                        <div style={{ width: '425px' }}>
                                                            <Typography.Text>
                                                                {subCategory.category}
                                                            </Typography.Text>
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <SwitchInput
                                                                name={`permissions[${index}].services[${subIndex}].hasAccess`}
                                                                onChange={checked => setFieldValue(
                                                                    `permissions[${index}].services[${subIndex}].hasAccess`,
                                                                    checked
                                                                )} />
                                                        </div>
                                                    </Flex>

                                                    <Table
                                                        dataSource={subCategory.services}
                                                        showHeader={false}
                                                        rowKey={records => records.id}
                                                        columns={[
                                                            {
                                                                title: 'Service',
                                                                dataIndex: 'service',
                                                                key: 'service',
                                                            },
                                                            {
                                                                title: 'Permissions',
                                                                key: 'permissions',
                                                                render: (
                                                                    _,
                                                                    service,
                                                                    serviceIndex
                                                                ) => (
                                                                    <Flex justify="right" gap={10}>
                                                                        {/* View Checkbox */}
                                                                        <div
                                                                            style={{
                                                                                width: '80px',
                                                                            }}
                                                                        >
                                                                            {' '}
                                                                            {/* Same width as "View" */}
                                                                            {Object.prototype.hasOwnProperty.call(
                                                                                service,
                                                                                'hasAccess'
                                                                            ) ? (
                                                                                <CheckboxInput
                                                                                    name={`permissions[${index}].services[${subIndex}].services[${serviceIndex}].hasAccess`}
                                                                                    checked={service.hasAccess}
                                                                                    onChange={e => setFieldValue(
                                                                                        `permissions[${index}].services[${subIndex}].services[${serviceIndex}].hasAccess`,
                                                                                        e.target
                                                                                            .checked
                                                                                    )}
                                                                                    disabled={!values
                                                                                        .permissions[index]
                                                                                        .hasAccess ||
                                                                                        !values
                                                                                            .permissions[index].services[subIndex].hasAccess}
                                                                                >
                                                                                    View
                                                                                </CheckboxInput>
                                                                            ) : (
                                                                                <span
                                                                                    style={{
                                                                                        visibility: 'hidden',
                                                                                    }}
                                                                                >
                                                                                    View
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Add Checkbox */}
                                                                        <div
                                                                            style={{
                                                                                width: '80px',
                                                                            }}
                                                                        >
                                                                            {' '}
                                                                            {/* Same width as "View" */}
                                                                            {Object.prototype.hasOwnProperty.call(
                                                                                service,
                                                                                'write'
                                                                            ) ? (
                                                                                <CheckboxInput
                                                                                    name={`permissions[${index}].services[${subIndex}].services[${serviceIndex}].write`}
                                                                                    checked={service.write}
                                                                                    onChange={e => setFieldValue(
                                                                                        `permissions[${index}].services[${subIndex}].services[${serviceIndex}].write`,
                                                                                        e.target
                                                                                            .checked
                                                                                    )}
                                                                                    disabled={!values
                                                                                        .permissions[index]
                                                                                        .hasAccess ||
                                                                                        !values
                                                                                            .permissions[index].services[subIndex].hasAccess}
                                                                                >
                                                                                    Add
                                                                                </CheckboxInput>
                                                                            ) : (
                                                                                <span
                                                                                    style={{
                                                                                        visibility: 'hidden',
                                                                                    }}
                                                                                >
                                                                                    Add
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Update Checkbox */}
                                                                        <div
                                                                            style={{
                                                                                width: '80px',
                                                                            }}
                                                                        >
                                                                            {Object.prototype.hasOwnProperty.call(
                                                                                service,
                                                                                'update'
                                                                            ) ? (
                                                                                <CheckboxInput
                                                                                    name={`permissions[${index}].services[${subIndex}].services[${serviceIndex}].update`}
                                                                                    checked={service.update}
                                                                                    onChange={e => setFieldValue(
                                                                                        `permissions[${index}].services[${subIndex}].services[${serviceIndex}].update`,
                                                                                        e.target
                                                                                            .checked
                                                                                    )}
                                                                                    disabled={!values
                                                                                        .permissions[index]
                                                                                        .hasAccess ||
                                                                                        !values
                                                                                            .permissions[index].services[subIndex].hasAccess}
                                                                                >
                                                                                    Update
                                                                                </CheckboxInput>
                                                                            ) : (
                                                                                <span
                                                                                    style={{
                                                                                        visibility: 'hidden',
                                                                                    }}
                                                                                >
                                                                                    Update
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </Flex>
                                                                ),
                                                            },
                                                        ]}
                                                        // rowKey={(service, serviceIndex) => serviceIndex}
                                                        pagination={false} />
                                                </div>
                                            )),
                                                

                                    }}
                                />
                                {/* {values.permissions?.map(
                                    (permission, index) =>
                                        permission.serviceCategory !== 'Profile' && (
                                            <Fragment key={index}>
                                                <SwitchInput
                                                    labelClasses="text-base text-end font-medium"
                                                    name={`permissions[${index}].hasAccess`}
                                                    label={permission.serviceCategory}
                                                    classes="mt-5"
                                                />
                                                <Row>
                                                    {permission.services.map(
                                                        (subCategory, subIndex) => (
                                                            <Col
                                                                xs={24}
                                                                sm={24}
                                                                md={24}
                                                                key={subIndex}
                                                            >
                                                                <SwitchInput
                                                                    name={`permissions[${index}].services[${subIndex}].hasAccess`}
                                                                    label={subCategory.category}
                                                                    labelClasses="text-sm"
                                                                />
                                                                <Row>
                                                                    {subCategory.services.map(
                                                                        (service, serviceIndex) => (
                                                                            <Col
                                                                                xs={24}
                                                                                sm={12}
                                                                                md={6}
                                                                                key={serviceIndex}
                                                                            >
                                                                                <CheckboxInput
                                                                                    name={`permissions[${index}].services[${subIndex}].services[${serviceIndex}].hasAccess`}
                                                                                    children={
                                                                                        <Typography.Text>
                                                                                            {
                                                                                                service.service
                                                                                            }
                                                                                        </Typography.Text>
                                                                                    }
                                                                                    isRequired
                                                                                    disabled={
                                                                                        !values
                                                                                            .permissions[
                                                                                            index
                                                                                        ]
                                                                                            .hasAccess ||
                                                                                        !values
                                                                                            .permissions[
                                                                                            index
                                                                                        ].services[
                                                                                            subIndex
                                                                                        ].hasAccess
                                                                                    }
                                                                                />
                                                                            </Col>
                                                                        )
                                                                    )}
                                                                </Row>
                                                            </Col>
                                                        )
                                                    )}
                                                </Row>
                                                <Divider />
                                            </Fragment>
                                        )
                                )} */}
                            </>
                        ) : (
                            <Skeleton active paragraph={{ rows: 10 }} />
                        )}
                    </Modal>
                );
            }}
        </Formik>
    );
};

export default RoleModal;
