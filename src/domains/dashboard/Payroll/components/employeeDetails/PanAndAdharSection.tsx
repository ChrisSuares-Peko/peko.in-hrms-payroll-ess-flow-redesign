import React, { useState } from 'react';

import { CheckCircleOutlined, CheckOutlined, EditOutlined } from '@ant-design/icons';
import { Form, Row, Col, Typography, Flex, Button, Modal, Divider } from 'antd';
import { Formik } from 'formik';
import { StringSchema } from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import OtpModal from '@components/molecular/modals/OtpModal';

import usePanVerifyApi from '../../hooks/employeeHooks/usePanVerifyApi';
import { validationSchema } from '../../schema/employee/panAdharschema';

type Props = {
    employeeId?: string;
    panNumber?: string;
    panVerified?: boolean;
    aadhaarNumber?: string;
    aadhaarVerified?: boolean;
    setRefState: (num: number) => void;
};

const PanAndAdharSection: React.FC<Props> = ({
    employeeId,
    panNumber,
    panVerified,
    aadhaarNumber,
    aadhaarVerified,
    setRefState,
}) => {
    const {
        isLoading,
        getPan,
        sendAadhaarOtp,
        isAadharLoading,
        isPanVerified,
        isAadhaarVerified,
        otpSending,
        verifyAadhaarOtp,
    } = usePanVerifyApi(employeeId!);

    // A PAN/Aadhaar NUMBER existing on the employee record doesn't mean it's been
    // verified — bulk upload (and other creation paths) writes the entered value directly
    // without ever running verification, and the "Verified" checkmark/lock must reflect
    // the real, persisted flag (see models/entities/employee.js's panVerified/
    // aadhaarVerified), not just whether a value happens to be present. isPanVerified is
    // this hook's own local, in-session state (true immediately after a successful Verify
    // click here, before the parent has refetched) — combined so the UI updates instantly
    // without waiting on a refetch.
    const panIsVerified = !!panVerified || isPanVerified;
    const aadhaarIsVerified = !!aadhaarVerified || isAadhaarVerified;

    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpRefId, setOtpRefId] = useState<string | null>(null);
    const [currentAadhaar, setCurrentAadhaar] = useState<string>('');
    const [isPanEditing, setIsPanEditing] = useState(false);
    const [isAadhaarEditing, setIsAadhaarEditing] = useState(false);
    const [isPanModalOpen, setIsPanModalOpen] = useState(false);
    const [panResultData, setPanResultData] = useState<any>(null);
    const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
    const [aadhaarResultData, setAadhaarResultData] = useState<any>(null);

    const handleOtpSubmit = async (otp: string) => {
        if (!otpRefId) return;
        try {
            const result = await verifyAadhaarOtp(otp, otpRefId, currentAadhaar);
            setIsOtpModalOpen(false);
            if (result) {
                setAadhaarResultData(result);
                setIsAadhaarModalOpen(true);
            }
        } catch (error) {
            console.error('OTP verification failed', error);
        }
    };

    return (
        <Row>
            <Formik
                initialValues={{
                    panNumber: panNumber || '',
                    aadhaarNumber: aadhaarNumber || '',
                }}
                validationSchema={validationSchema}
                onSubmit={values => {
                    // Handle form submission
                }}
                enableReinitialize
            >
                {({ values, errors, validateField, setFieldTouched }) => (
                    <Form layout="vertical">
                        <Row>
                            <Typography.Text className="text-base font-medium mt-8">
                                PAN & Aadhar Information
                            </Typography.Text>
                            <Col span={24} className="mt-8">
                                <Flex className="w-full" justify="space-between" gap={10}>
                                    <TextInput
                                        label={
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                            >
                                                {panIsVerified ? 'PAN Number (Verified)' : 'PAN Number'}
                                                {panIsVerified && (
                                                    <>
                                                        <CheckCircleOutlined style={{ color: 'green', fontSize: 16 }} />
                                                        <EditOutlined
                                                            style={{ fontSize: 14, color: 'red', cursor: 'pointer' }}
                                                            onClick={() => setIsPanEditing(true)}
                                                        />
                                                    </>
                                                )}
                                            </span>
                                        }
                                        placeholder="Enter PAN"
                                        type="text"
                                        name="panNumber"
                                        classes="w-full"
                                        isRequired
                                        formItemClass="w-full"
                                        allowUpperCaseOnly
                                        maxLength={10}
                                        isDisabled={panIsVerified && !isPanEditing}
                                    />

                                    <Button
                                        danger
                                        disabled={panIsVerified && !isPanEditing}
                                        className="mt-7"
                                        loading={isLoading}
                                        onClick={async () => {
                                            const panFieldSchema = validationSchema.fields
                                                .panNumber as StringSchema;
                                            await panFieldSchema.validate(values.panNumber);
                                            const result = await getPan(values.panNumber);
                                            if (result) {
                                                setPanResultData(result);
                                                setIsPanModalOpen(true);
                                            }
                                        }}
                                    >
                                        {panIsVerified && !isPanEditing ? 'Verified' : 'Verify'}
                                    </Button>
                                </Flex>
                            </Col>
                            <Col span={24}>
                                <Flex className="w-full" justify="space-between" gap={10}>
                                    <TextInput
                                        label={
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                            >
                                                {aadhaarIsVerified ? 'Aadhaar Number (Verified)' : 'Aadhaar Number'}
                                                {aadhaarIsVerified && (
                                                    <>
                                                        <CheckCircleOutlined style={{ color: 'green', fontSize: 16 }} />
                                                        <EditOutlined
                                                            style={{ fontSize: 14, color: 'red', cursor: 'pointer' }}
                                                            onClick={() => setIsAadhaarEditing(true)}
                                                        />
                                                    </>
                                                )}
                                            </span>
                                        }
                                        placeholder="Enter Aadhaar number"
                                        type="text"
                                        name="aadhaarNumber"
                                        classes="w-full"
                                        formItemClass="w-full"
                                        maxLength={12}
                                        isRequired
                                        allowNumbersOnly
                                        isDisabled={aadhaarIsVerified && !isAadhaarEditing}
                                    />

                                    <Button
                                        danger
                                        disabled={aadhaarIsVerified && !isAadhaarEditing}
                                        loading={isAadharLoading}
                                        className="mt-7"
                                        onClick={async () => {
                                            try {
                                                // mark field touched so error UI shows
                                                await setFieldTouched('aadhaarNumber', true, true);

                                                // validate ONLY aadhaar using yup
                                                const aadhaarSchema = validationSchema.fields
                                                    .aadhaarNumber as StringSchema;

                                                await aadhaarSchema.validate(values.aadhaarNumber);

                                                //  only reaches here if valid
                                                const ref_id = await sendAadhaarOtp(
                                                    values.aadhaarNumber
                                                );
                                                setOtpRefId(ref_id);
                                                setCurrentAadhaar(values.aadhaarNumber);
                                                setIsOtpModalOpen(true);
                                            } catch (err) {
                                                console.error('Validation error:', err);
                                            }
                                        }}
                                    >
                                        {aadhaarIsVerified && !isAadhaarEditing ? 'Verified' : 'Verify'}
                                    </Button>
                                </Flex>
                            </Col>
                        </Row>
                    </Form>
                )}
            </Formik>
            <OtpModal
                isOpen={isOtpModalOpen}
                handleCancel={() => setIsOtpModalOpen(false)}
                title="Enter OTP"
                handleSubmit={handleOtpSubmit}
                isLoading={otpSending}
            />

            <Modal
                open={isPanModalOpen}
                onCancel={() => setIsPanModalOpen(false)}
                footer={null}
                centered
                width={500}
            >
                <Flex vertical align="center" gap={8} style={{ paddingTop: 8 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckOutlined style={{ color: '#fff', fontSize: 28 }} />
                    </div>
                    <Typography.Title level={4} style={{ margin: 0 }}>PAN Details</Typography.Title>
                    <Typography.Text type="secondary" style={{ textAlign: 'center', fontSize: 13 }}>
                        We have fetched PAN details from official records. Ensure this PAN belongs to you.
                    </Typography.Text>
                </Flex>

                <Divider />

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Registered Name</Typography.Text>
                        <div><Typography.Text strong>{panResultData?.registered_name || '—'}</Typography.Text></div>
                    </Col>
                    <Col span={12}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>PAN</Typography.Text>
                        <div><Typography.Text strong>{panResultData?.pan || '—'}</Typography.Text></div>
                    </Col>
                </Row>

                <div style={{ marginBottom: 16 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>Name Match Score</Typography.Text>
                    <div><Typography.Text strong>{panResultData?.name_match_score ?? '—'}</Typography.Text></div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>Status</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '2px 10px',
                            borderRadius: 999,
                            background: panResultData?.valid ? '#f6ffed' : '#fff2f0',
                            border: `1px solid ${panResultData?.valid ? '#b7eb8f' : '#ffa39e'}`,
                            fontSize: 13,
                            color: panResultData?.valid ? '#389e0d' : '#cf1322',
                        }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: panResultData?.valid ? '#52c41a' : '#ff4d4f', display: 'inline-block' }} />
                            {panResultData?.valid ? 'Valid' : 'Invalid'}
                        </span>
                    </div>
                </div>

                <Flex justify="flex-end" gap={8}>
                    <Button onClick={() => setIsPanModalOpen(false)}>Cancel</Button>
                    <Button
                        type="primary"
                        danger
                        onClick={() => {
                            setRefState(new Date().valueOf());
                            setIsPanModalOpen(false);
                        }}
                    >
                        Save
                    </Button>
                </Flex>
            </Modal>

            <Modal
                open={isAadhaarModalOpen}
                onCancel={() => setIsAadhaarModalOpen(false)}
                footer={null}
                centered
                width={520}
            >
                <Flex vertical align="center" gap={8} style={{ paddingTop: 8 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckOutlined style={{ color: '#fff', fontSize: 28 }} />
                    </div>
                    <Typography.Title level={4} style={{ margin: 0 }}>Aadhaar Details</Typography.Title>
                    <Typography.Text type="secondary" style={{ textAlign: 'center', fontSize: 13 }}>
                        We have fetched Aadhaar details from official records. Ensure this Aadhaar belongs to you.
                    </Typography.Text>
                </Flex>

                <Divider />

                {aadhaarResultData?.photo_link && (
                    <Flex justify="center" style={{ marginBottom: 16 }}>
                        <img
                            src={`data:image/jpeg;base64,${aadhaarResultData.photo_link}`}
                            alt="Aadhaar"
                            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f0f0f0' }}
                        />
                    </Flex>
                )}

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Name</Typography.Text>
                        <div><Typography.Text strong>{aadhaarResultData?.name || '—'}</Typography.Text></div>
                    </Col>
                    <Col span={12}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Date of Birth</Typography.Text>
                        <div><Typography.Text strong>{aadhaarResultData?.dob || '—'}</Typography.Text></div>
                    </Col>
                    <Col span={12}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Gender</Typography.Text>
                        <div>
                            <Typography.Text strong>
                                {({ M: 'Male', F: 'Female' } as Record<string, string>)[aadhaarResultData?.gender] ?? aadhaarResultData?.gender ?? '—'}
                            </Typography.Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Care Of</Typography.Text>
                        <div><Typography.Text strong>{aadhaarResultData?.care_of || '—'}</Typography.Text></div>
                    </Col>
                    <Col span={24}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Address</Typography.Text>
                        <div><Typography.Text strong>{aadhaarResultData?.address || '—'}</Typography.Text></div>
                    </Col>
                </Row>

                <div style={{ marginBottom: 24 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>Status</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '2px 10px',
                            borderRadius: 999,
                            background: aadhaarResultData?.status === 'VALID' ? '#f6ffed' : '#fff2f0',
                            border: `1px solid ${aadhaarResultData?.status === 'VALID' ? '#b7eb8f' : '#ffa39e'}`,
                            fontSize: 13,
                            color: aadhaarResultData?.status === 'VALID' ? '#389e0d' : '#cf1322',
                        }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: aadhaarResultData?.status === 'VALID' ? '#52c41a' : '#ff4d4f', display: 'inline-block' }} />
                            {aadhaarResultData?.status === 'VALID' ? 'Valid' : 'Invalid'}
                        </span>
                    </div>
                </div>

                <Flex justify="flex-end" gap={8}>
                    <Button onClick={() => setIsAadhaarModalOpen(false)}>Cancel</Button>
                    <Button
                        type="primary"
                        danger
                        onClick={() => {
                            setRefState(new Date().valueOf());
                            setIsAadhaarModalOpen(false);
                        }}
                    >
                        Save
                    </Button>
                </Flex>
            </Modal>
        </Row>
    );
};

export default PanAndAdharSection;
