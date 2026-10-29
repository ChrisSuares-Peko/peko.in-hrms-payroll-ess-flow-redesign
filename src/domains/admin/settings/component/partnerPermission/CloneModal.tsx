import React, { Fragment, useEffect, useState } from 'react';

import { Button, Col, Divider, Flex, Modal, Row, Skeleton, Typography } from 'antd';
import { Form, Formik } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
// import SwitchInput from '@components/atomic/inputs/SwitchInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { refresh } from '../../../officeSupplies/types/products';
import usePartnerRoleData from '../../../users/hooks/usePartnerRoleData';
import usePartnersForCorporate from '../../../users/hooks/usePartnersForCorporate';
import useUpdateRoles from '../../../users/hooks/useUpdateRoles';
import { Permission, Role } from '../../../users/types/systemUserTypes';
import useClonePartner from '../../hooks/useClonePartner';
import CloneModalSchema from '../../schema/cloneModalSchema';

type RoleModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Role;
};

const CloneModal = ({ open, handleCancel, data, setRefresh }: RoleModalProps & refresh) => {
    const dispatch = useAppDispatch();
    const { getPartnerFrom, partnerDataTo, getPartnerTo } = useClonePartner();

    useEffect(() => {
        getPartnerFrom();
        getPartnerTo();
    }, [getPartnerFrom, getPartnerTo]);

    const { permissionData, updateRoleApi, createNewPartnerClone, isloading } = useUpdateRoles();
    const { getPartnerData, partnerData } = usePartnerRoleData();
    const { categoryDatas } = usePartnersForCorporate('');

    const [checkboxStates, setCheckboxStates] = useState<any>([]);
    const [, setPartnerToData] = useState<any>(null);
    const [partnerFromId, setPartnerFromId] = useState<any>(null);
    // const [partnerToId, setPartnerToId] = useState<any>(null);

    useEffect(() => {
        if (categoryDatas && categoryDatas?.length > 0) {
            getPartnerData(categoryDatas[0].id.toString());
            setPartnerFromId(categoryDatas[0].id);
        }
    }, [categoryDatas, getPartnerData]);

    useEffect(() => {
        if (partnerData && partnerData.length > 0) {
            const initialStates = partnerData.map((partner: any) => ({
                partnerId: partner.id,
                serviceOperators:
                    partner.serviceOperators?.map((operator: any) => ({
                        operatorId: operator.id,
                        hasAccess: operator.hasAccess,
                    })) || [],
            }));
            setCheckboxStates(initialStates);
        }
    }, [partnerData]);
    const handlePartnerToChange = (value: number | string) => {
        // setPartnerToId(value)
        const selectedData: any = partnerDataTo?.find(item => item.value === value);
        if (selectedData) {
            setPartnerToData(selectedData);
        } else {
            setPartnerToData(undefined);
        }
    };

    // **handlePartnerChange** should handle the change in the "From Partner" select dropdown
    const handlePartnerChange = async (partnerId: string) => {
        // setPartnerFromId(partnerId)
        await getPartnerData(partnerId); // Fetch partner-specific data based on selected partner
    };
    const updateMockService = (mockServices: Permission[], existingServices: Permission[]) =>
        mockServices.map(mockServiceCategory => {
            const matchingExistingCategory = existingServices.find(
                existingServiceCategory =>
                    existingServiceCategory.serviceCategory === mockServiceCategory.serviceCategory
            );

            if (matchingExistingCategory) {
                mockServiceCategory.hasAccess = matchingExistingCategory.hasAccess;
                mockServiceCategory.services = mockServiceCategory.services.map(mockSubCategory => {
                    const matchingExistingSubCategory = matchingExistingCategory.services.find(
                        existingSubCategory =>
                            existingSubCategory.category === mockSubCategory.category
                    );

                    if (matchingExistingSubCategory) {
                        mockSubCategory.hasAccess = matchingExistingSubCategory.hasAccess;
                        mockSubCategory.services = mockSubCategory.services.map(mockServiceItem => {
                            const matchingExistingService =
                                matchingExistingSubCategory.services.find(
                                    existingServiceItem =>
                                        existingServiceItem.service === mockServiceItem.service
                                );

                            if (matchingExistingService) {
                                mockServiceItem.hasAccess = matchingExistingService.hasAccess;
                            }

                            return mockServiceItem;
                        });
                    }

                    return mockSubCategory;
                });
            }

            return mockServiceCategory;
        });

    let updatedMockService: Permission[] = [];
    if (data && permissionData) {
        updatedMockService = updateMockService(permissionData, data.permissions);
    } else if (permissionData) {
        updatedMockService = permissionData;
    }

    // Function to calculate default selectedIds
    const calculateSelectedIds = (partnerDatas: any) => {
        if (!partnerDatas || !Array.isArray(partnerDatas)) {
            return []; // Return an empty array if partnerData is undefined or not an array
        }

        return partnerDatas.flatMap(
            (partner: any) =>
                partner.serviceOperators
                    ? partner.serviceOperators
                          .filter((operator: any) => operator.hasAccess) // Only include operators with hasAccess
                          .map((operator: any) => operator.id) // Return operatorId
                    : [] // If serviceOperators is undefined, return an empty array
        );
    };
    const calculatePackageIds = (partnerDatas: any) => {
        if (!partnerDatas || !Array.isArray(partnerDatas)) {
            return []; // Return an empty array if partnerData is undefined or not an array
        }
        // Map over partnerData and return packageId for each partner
        return partnerDatas
            .filter((partner: any) => partner.hasAccess) // Include only partners with hasAccess
            .map((partner: any) => partner.packageId);
    };

    return (
        <Formik
            initialValues={{
                id: data?.id,
                roleName: data?.roleName,
                permissions: updatedMockService, // initial mock data
                cashbackIds: calculateSelectedIds(partnerData), // Dynamically set selectedIds
                packageIds: calculatePackageIds(partnerData),
                partnerId: partnerFromId,
                registeredBy: partnerFromId,
                toPartner: null,
            }}
            validationSchema={CloneModalSchema}
            onSubmit={async values => {
                let res: any;
                if (data) {
                    res = await updateRoleApi({ ...values });
                } else {
                    res = await createNewPartnerClone({ ...values });
                }
                if (res.status === true) {
                    setRefresh(true);
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
            enableReinitialize
        >
            {({ handleSubmit, setFieldValue, values }) => {
                // State to hold checkbox values for each partner

                // Sync partnerData with local checkbox state on initial render or when partnerData changes

                // Handle checkbox change
                const handleCheckboxChange = (
                    partnerIndex: number,
                    operatorIndex: number,
                    checked: boolean
                ) => {
                    const updatedCheckboxStates = [...checkboxStates];
                    updatedCheckboxStates[partnerIndex].serviceOperators[operatorIndex].hasAccess =
                        checked;
                    setCheckboxStates(updatedCheckboxStates);

                    // Update selectedIds
                    const cashbackIds = updatedCheckboxStates
                        .flatMap((partner: any) =>
                            partner.serviceOperators.filter((operator: any) => operator.hasAccess)
                        )
                        .map((operator: any) => operator.operatorId);

                    // Sync with Formik
                    setFieldValue('cashbackIds', cashbackIds); // Update Formik with selectedIds
                    setFieldValue('permissions', updatedCheckboxStates); // Update permissions too
                };

                return (
                    <Modal
                        width={1000}
                        centered
                        title="Add New Partner"
                        footer={[
                            <Flex className="w-full " justify="flex-end" gap={10} key="">
                                <Button
                                    key="submit"
                                    type="primary"
                                    danger
                                    loading={isloading}
                                    onClick={e => {
                                        // Prevent form submission on checkbox change or other UI elements click
                                        e.stopPropagation();
                                        handleSubmit();
                                    }}
                                    className="px-5"
                                >
                                    Submit
                                </Button>
                                <Button key="back" onClick={handleCancel} className="px-5">
                                    Cancel
                                </Button>
                            </Flex>,
                        ]}
                        open={open} // Ensure open prop is controlled from parent and not inadvertently changed
                        onCancel={handleCancel}
                    >
                        <Form>
                            {updatedMockService.length > 0 ? (
                                <>
                                    {categoryDatas ? (
                                        <Row gutter={[16, 16]}>
                                            {/* Existing Partner Dropdown */}
                                            <Col xs={24} sm={12}>
                                                <SelectInput
                                                    name="registeredBy"
                                                    options={(categoryDatas || []).map(d => ({
                                                        value: d.id,
                                                        label: d.name,
                                                    }))}
                                                    placeholder="Select From Partner"
                                                    label="From Partner"
                                                    handleChange={value => {
                                                        setPartnerFromId(value);
                                                        handlePartnerChange(value);
                                                    }} // calling handlePartnerChange
                                                    // allowClear
                                                />
                                            </Col>
                                            {/* New Dropdown */}
                                            <Col xs={24} sm={12}>
                                                <SelectInput
                                                    name="toPartner"
                                                    options={partnerDataTo?.map((item: any) => ({
                                                        value: item.value,
                                                        label: item.label,
                                                    }))}
                                                    placeholder="Select To Partner"
                                                    label="To Partner"
                                                    isRequired
                                                    handleChange={value => {
                                                        setFieldValue('newPartnerId', value);
                                                        // setPartnerToId(value)
                                                        handlePartnerToChange(value);
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                    ) : (
                                        <Skeleton.Input active block />
                                    )}

                                    <Typography.Title level={5} className="pb-5">
                                        Permissions
                                    </Typography.Title>
                                    {partnerData?.map((partner, partnerIndex) => (
                                        <Fragment key={partnerIndex}>
                                            <Typography.Text>{partner.label}</Typography.Text>
                                            <Row>
                                                {partner.serviceOperators?.map(
                                                    (operator: any, operatorIndex: any) => (
                                                        <Col xs={24} sm={12} key={operatorIndex}>
                                                            <CheckboxInput
                                                                name={`permissions[${partnerIndex}].serviceOperators[${operatorIndex}].hasAccess`}
                                                                checked={
                                                                    checkboxStates[partnerIndex]
                                                                        ?.serviceOperators[
                                                                        operatorIndex
                                                                    ]?.hasAccess || false
                                                                }
                                                                onChange={e => {
                                                                    handleCheckboxChange(
                                                                        partnerIndex,
                                                                        operatorIndex,
                                                                        e.target.checked
                                                                    );
                                                                }}
                                                            >
                                                                <Typography.Text>
                                                                    {operator.serviceProvider} (
                                                                    {operator.accessKey})
                                                                </Typography.Text>
                                                            </CheckboxInput>
                                                        </Col>
                                                    )
                                                )}
                                            </Row>
                                            <Divider />
                                        </Fragment>
                                    ))}
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

export default CloneModal;
