import { Suspense, lazy, useState } from 'react';

import { Button, Col, Flex, Row, Skeleton, Typography, theme } from 'antd';

import FieldLabelValue from '@components/molecular/Text/FieldLabelValue';
import { useAppSelector } from '@src/hooks/store';

import useGetPasswordPolicies from '../hooks/useGetPasswordPolicies';
import usePasswordPolicyValidation from '../hooks/usePasswordPolicyValidation';

const BasicInfoModal = lazy(() => import('./BasicInfoModal'));
const ChangerPasswordModal = lazy(() => import('./ChangePasswordModal'));

const BasicInfo = () => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const { user } = useAppSelector(state => state.reducer.user);

    const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
    const [openBasicInfoModal, setOpenBasicInfoModal] = useState(false);
    const { data, isLoading } = useAppSelector(state => state.reducer.basicInfo);
    const { respData } = useGetPasswordPolicies();

    const { validatePassword } = usePasswordPolicyValidation(respData);
    return (
        <>
            <Flex vertical className="  border border-solid border-gray-200 p-6  mt-8 rounded-xl">
                <Flex className=" w-full" justify="space-between" align="center">
                    <Typography.Title level={5}>Basic Information</Typography.Title>
                    <Flex align="center" gap={20}>
                        <Typography.Link
                            style={{ color: colorPrimary }}
                            onClick={() => setOpenChangePasswordModal(true)}
                        >
                            Change Password
                        </Typography.Link>
                        <Button danger size="small" onClick={() => setOpenBasicInfoModal(true)}>
                            Edit Info
                        </Button>
                    </Flex>
                </Flex>
                <Row className=" mt-7" gutter={[20, 20]}>
                    <Col span={11}>
                        {isLoading ? (
                            <Skeleton active />
                        ) : (
                            <Flex vertical gap={15}>
                                <FieldLabelValue label="Company Name" value={data?.name} />
                                <FieldLabelValue label="Business Email" value={data?.email} />{' '}
                                <FieldLabelValue
                                    label="Full Name"
                                    value={data?.contactPersonName}
                                />
                                <FieldLabelValue label="City" value={data?.city} />
                                <FieldLabelValue
                                    label="Company Size"
                                    value={data?.companySize ? `${data.companySize} Employees` : ''}
                                />
                            </Flex>
                        )}
                    </Col>
                    <Col span={13}>
                        {isLoading ? (
                            <Skeleton active />
                        ) : (
                            <Flex vertical gap={15}>
                                <Flex align="flex-end" gap={12}>
                                    <FieldLabelValue
                                        label="Mobile Number"
                                        value={`+91 ${data?.mobileNo}`}
                                    />
                                    <Typography.Link
                                        className="hidden"
                                        style={{ color: colorPrimary }}
                                    >
                                        Verify
                                    </Typography.Link>
                                </Flex>
                                <FieldLabelValue
                                    label="Peko Account Number"
                                    value={data?.credential?.username || user?.username}
                                />
                                <FieldLabelValue label="Designation" value={data?.designation} />

                                <FieldLabelValue label="State" value={data?.state} />
                                <FieldLabelValue
                                    label="Landline Number"
                                    value={data?.landlineNo === '' ? null : data?.landlineNo}
                                />
                            </Flex>
                        )}
                    </Col>
                </Row>
            </Flex>
            <Suspense>
                {openChangePasswordModal && (
                    <ChangerPasswordModal
                        validatePassword={validatePassword}
                        open={openChangePasswordModal}
                        handleCancel={() => setOpenChangePasswordModal(false)}
                    />
                )}
                {openBasicInfoModal && (
                    <BasicInfoModal
                        open={openBasicInfoModal}
                        handleCancel={() => setOpenBasicInfoModal(false)}
                    />
                )}
            </Suspense>
        </>
    );
};

export default BasicInfo;
