import React, { useEffect, useState } from 'react';

import { Button, Flex, Modal, Skeleton, Switch, Table, Typography } from 'antd';
import { Formik } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { assignPartnerServicesSchema } from '../schema/partnerServicesSchema';
import { PartnerOption } from '../types/partnerServices';

type Props = {
    open: boolean;
    handleCancel: () => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    partner?: { id: number; name: string };
    isLoading: boolean;
    partnerOptions: PartnerOption[];
    initialRoles: any[];
    fetchExistingAccess: (partnerId: number) => Promise<void>;
    assignServiceAccess: (partnerId: number, permissions: any[]) => Promise<any>;
};

const ACCESS_FLAGS: { key: 'hasAccess' | 'write' | 'update'; label: string }[] = [
    { key: 'hasAccess', label: 'View' },
    { key: 'write', label: 'Add' },
    { key: 'update', label: 'Update' },
];

const AssignPartnerServicesModal = ({
    open,
    handleCancel,
    setRefresh,
    partner,
    isLoading,
    partnerOptions,
    initialRoles,
    fetchExistingAccess,
    assignServiceAccess,
}: Props) => {
    const dispatch = useAppDispatch();
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

    useEffect(() => {
        if (open && partner?.id) {
            fetchExistingAccess(partner.id);
        }
    }, [fetchExistingAccess, open, partner?.id]);

    const resolvedOptions = partner
        ? [
              { value: partner.id, label: partner.name },
              ...partnerOptions.filter(p => p.value !== partner.id),
          ]
        : partnerOptions;

    const handleExpand = (expanded: boolean, record: any) => {
        setExpandedRowKeys(prev =>
            expanded ? [...prev, record.recordIndex] : prev.filter(k => k !== record.recordIndex)
        );
    };

    return (
        <Formik
            initialValues={{
                partnerId: partner?.id as number | undefined,
                permissions: initialRoles,
            }}
            enableReinitialize
            validationSchema={assignPartnerServicesSchema}
            onSubmit={async values => {
                if (!values.partnerId) return;
                const res: any = await assignServiceAccess(values.partnerId, values.permissions);
                if (res && res.status === true) {
                    setRefresh(true);
                    dispatch(showToast({ description: res.message, variant: 'success' }));
                    handleCancel();
                } else if (res && res.status === false) {
                    dispatch(showToast({ description: res.message, variant: 'error' }));
                }
            }}
        >
            {({ values, handleSubmit, setFieldValue }) => {
                const onClickSubmit: React.MouseEventHandler<HTMLElement> = e => {
                    e.preventDefault();
                    handleSubmit();
                };

                const isLeafDisabled = (categoryIndex: number, subIndex: number) =>
                    !values.permissions[categoryIndex]?.hasAccess ||
                    !values.permissions[categoryIndex]?.services?.[subIndex]?.hasAccess;

                const columns = [
                    {
                        title: 'Feature or Service',
                        dataIndex: 'serviceCategory',
                        key: 'serviceCategory',
                    },
                    {
                        title: 'Active Status',
                        key: 'hasAccess',
                        render: (_: any, record: any) => (
                            <Switch
                                checked={values.permissions[record.recordIndex]?.hasAccess}
                                onChange={checked =>
                                    setFieldValue(
                                        `permissions[${record.recordIndex}].hasAccess`,
                                        checked
                                    )
                                }
                            />
                        ),
                    },
                    {
                        title: 'Permissions',
                        key: 'permissions',
                    },
                ];

                const renderSubCategory = (
                    categoryIndex: number,
                    subCategory: any,
                    subIndex: number
                ) => (
                    <div key={subIndex}>
                        <Flex align="center" gap={8}>
                            <div style={{ width: '425px' }}>
                                <Typography.Text>{subCategory.category}</Typography.Text>
                            </div>
                            <Flex align="center">
                                <Switch
                                    checked={
                                        values.permissions[categoryIndex]?.services?.[subIndex]
                                            ?.hasAccess
                                    }
                                    onChange={checked =>
                                        setFieldValue(
                                            `permissions[${categoryIndex}].services[${subIndex}].hasAccess`,
                                            checked
                                        )
                                    }
                                />
                            </Flex>
                        </Flex>

                        <Table
                            dataSource={subCategory.services}
                            showHeader={false}
                            rowKey={(_: any, svcIdx: any) => svcIdx}
                            columns={[
                                {
                                    title: 'Service',
                                    dataIndex: 'service',
                                    key: 'service',
                                },
                                {
                                    title: 'Permissions',
                                    key: 'permissions',
                                    render: (_: any, service: any, serviceIndex: number) => (
                                        <Flex justify="right" gap={10}>
                                            {ACCESS_FLAGS.map(flag => (
                                                <div key={flag.key} style={{ width: '80px' }}>
                                                    {Object.prototype.hasOwnProperty.call(
                                                        service,
                                                        flag.key
                                                    ) ? (
                                                        <CheckboxInput
                                                            name={`permissions[${categoryIndex}].services[${subIndex}].services[${serviceIndex}].${flag.key}`}
                                                            checked={service[flag.key]}
                                                            onChange={e =>
                                                                setFieldValue(
                                                                    `permissions[${categoryIndex}].services[${subIndex}].services[${serviceIndex}].${flag.key}`,
                                                                    e.target.checked
                                                                )
                                                            }
                                                            disabled={isLeafDisabled(
                                                                categoryIndex,
                                                                subIndex
                                                            )}
                                                        >
                                                            {flag.label}
                                                        </CheckboxInput>
                                                    ) : (
                                                        <span style={{ visibility: 'hidden' }}>
                                                            {flag.label}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </Flex>
                                    ),
                                },
                            ]}
                            pagination={false}
                        />
                    </div>
                );

                return (
                    <Modal
                        width={1000}
                        centered
                        title={
                            partner
                                ? `Manage Services — ${partner.name}`
                                : 'Assign Partner Services'
                        }
                        open={open}
                        onCancel={handleCancel}
                        footer={[
                            <Flex className="w-full" justify="flex-end" gap={10} key="footer">
                                <Button
                                    key="submit"
                                    type="primary"
                                    danger
                                    loading={isLoading}
                                    onClick={onClickSubmit}
                                    className="px-5"
                                >
                                    Submit
                                </Button>
                                <Button key="back" onClick={handleCancel} className="px-5">
                                    Cancel
                                </Button>
                            </Flex>,
                        ]}
                    >
                        {isLoading && initialRoles.length === 0 ? (
                            <Skeleton active paragraph={{ rows: 10 }} />
                        ) : (
                            <>
                                <CustomSelectSearch
                                    name="partnerId"
                                    options={resolvedOptions.map(p => ({
                                        oValue: p.value,
                                        oName: p.label,
                                    }))}
                                    placeholder="Select a partner"
                                    label="Partner"
                                    isRequired
                                    showSearch
                                    isDisabled={!!partner}
                                />

                                <Typography.Title level={5} className="pb-5">
                                    Permissions
                                </Typography.Title>

                                <Table
                                    rowKey="recordIndex"
                                    columns={columns}
                                    dataSource={values.permissions.map(
                                        (record: any, index: number) => ({
                                            ...record,
                                            recordIndex: index,
                                        })
                                    )}
                                    pagination={false}
                                    expandable={{
                                        expandedRowKeys,
                                        onExpand: handleExpand,
                                        expandedRowRender: (record: any) =>
                                            record.services?.map(
                                                (subCategory: any, subIndex: number) =>
                                                    renderSubCategory(
                                                        record.recordIndex,
                                                        subCategory,
                                                        subIndex
                                                    )
                                            ),
                                    }}
                                />
                            </>
                        )}
                    </Modal>
                );
            }}
        </Formik>
    );
};

export default AssignPartnerServicesModal;
