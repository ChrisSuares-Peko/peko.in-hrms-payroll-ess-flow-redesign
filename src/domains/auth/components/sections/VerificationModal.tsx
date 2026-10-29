/* eslint-disable prefer-const */
import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Badge, Button, Divider, Flex, Modal, Result, Typography } from 'antd';
import Lottie from 'react-lottie';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { setUpdateKycStatus } from '@src/domains/dashboard/profile/slices/companyInfo';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useSavePanGstCin from '../../hooks/useSavePanGstCin';
import { nextStep } from '../../slices/registerSlice';
import { verificationConfigNew, InputConfigNew } from '../../utils/data';

type modalProps = {
    isOpen: boolean;
    handleCancel: () => void;
    handleLogin: () => void;
    data?: any;
    formValues?: any;
    email: string;
    onVerified: (type: 'pan' | 'gst', number: string) => void;
    signupType?: string;
};
const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

function getValueByPath(obj: any, path: string) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

const getNestedValue = (obj: any, path: any) => {
    const pathParts = path.split('.');
    return pathParts.reduce((acc: any, part: any) => {
        if (!acc) return undefined;

        // Handle array indices in path, e.g., 'address_list[0]'
        if (part.includes('[')) {
            const key = part.split('[')[0]; // Get the key before the array
            const index = parseInt(part.split('[')[1].replace(']', ''), 10); // Get the array index
            return acc[key] ? acc[key][index] : undefined;
        }
        return acc[part];
    }, obj);
};

const VerificationModal = ({
    isOpen,
    handleCancel,
    data,
    formValues,
    handleLogin,
    email,
    onVerified,
    signupType,
}: modalProps) => {
    const dispatch = useAppDispatch();

    const { saveDocument, isLoading } = useSavePanGstCin();
    const serviceKey = data?.accessKey;

    // for response data
    const currentConfig = verificationConfigNew[serviceKey];
    let dynamicGroupedDetails: { label: string; value: string }[][] = [];

    if (currentConfig) {
        const rawData = currentConfig.getData(data?.response);
        const fields =
            signupType === 'FREELANCER'
                ? currentConfig.fields.filter(f => f.key !== 'name_match_score')
                : currentConfig.fields;

        const flatList = [
            // {
            //     label: 'Verification Date',
            //     value: formattedDateOnly(
            //         new Date(data?.datetime || responseData?.createdAt || new Date())
            //     ),
            // },
            ...fields.map(({ label, key }) => {
                let rawValue = getNestedValue(rawData, key);

                // Optional custom formatting for booleans
                if (key === 'valid' && typeof rawValue === 'boolean') {
                    rawValue = rawValue ? 'VALID' : 'INVALID';
                }

                return {
                    label,
                    value: rawValue ?? '-',
                };
            }),
        ];

        for (let i = 0; i < flatList.length; i += 2) {
            dynamicGroupedDetails.push(flatList.slice(i, i + 2));
        }
    }

    // for input data
    const currentInputConfig = InputConfigNew[serviceKey];
    let dynamicGroupedInputDetails: { label: string; value: string }[][] = [];

    if (currentInputConfig) {
        const rawData = currentInputConfig.getData(formValues, data.response);
        const flatList = [
            ...currentInputConfig.fields.map(({ label, key }) => ({
                label,
                value: getValueByPath(rawData, key) || '-',
            })),
        ];

        for (let i = 0; i < flatList.length; i += 2) {
            dynamicGroupedInputDetails.push(flatList.slice(i, i + 2));
        }
    }

    const validity =
        currentConfig?.getValidityStatus && currentConfig.getValidityStatus(data.response);

    const handleSave = async () => {
        if (validity !== 'VALID') {
            console.warn('Cannot save invalid verification.');
            return;
        }
        const payload: Record<string, string> = {};
        payload.email = email;
        if (serviceKey === 'gstin_verify') {
            payload.gst = data?.gstNumber || data.response.gst;
            payload.type = 'gst';
        } else if (serviceKey === 'pan_verify') {
            payload.pan = data?.panNumber || data.response.pan;
            payload.type = 'pan';
        } else {
            console.error('Unsupported serviceKey:', serviceKey);
            return;
        }

        try {
            const response = await saveDocument(payload); // Replace with your actual save function
            if (serviceKey === 'pan_verify') {
                dispatch(
                    setUpdateKycStatus({
                        panVerified: response.panVerified,
                        panNumber: response.panNumber,
                    })
                );
                if (!response.panVerified) {
                    dispatch(showToast({ description: data.message, variant: 'error' }));
                } else {
                    dispatch(
                        showToast({ description: 'PAN verified successfully', variant: 'success' })
                    );
                    onVerified('pan', response.panNumber);
                }
            } else if (serviceKey === 'gstin_verify') {
                dispatch(
                    setUpdateKycStatus({
                        gstVerified: response.gstVerified,
                        gstNumber: response.gstNumber,
                    })
                );
                if (!response.gstVerified) {
                    dispatch(showToast({ description: data.message, variant: 'error' }));
                } else {
                    dispatch(
                        showToast({
                            description: 'GSTIN verified successfully',
                            variant: 'success',
                        })
                    );
                    onVerified('gst', response.gstNumber);
                }
            }
            const { panVerified, gstVerified } = response;
            if (panVerified || gstVerified) {
                dispatch(nextStep());
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };
    const badgeColor = validity === 'VALID' ? '#16a34a' : '#dc2626';
    const badgeBg = validity === 'VALID' ? '#d1fae5' : '#fee2e2';

    const capitalizeFirstLetter = (input: string | number): string | number => {
        if (typeof input === 'number') return input;

        // Don't modify if input contains any number
        if (/\d/.test(input)) return input;

        if (!input) return '';

        return input
            .toString() // Ensure the input is a string
            .replace(/_/g, ' ') // Replace underscores with spaces
            .toLowerCase() // Convert the entire string to lowercase
            .split(' ') // Split the string by spaces
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
            .join(' '); // Join the words back with spaces
    };

    return (
        <Modal
            title=""
            open={isOpen}
            onCancel={handleCancel}
            closeIcon={<CloseOutlined />}
            centered
            width={650}
            footer={null}
            style={{ borderRadius: '25px', overflow: 'hidden' }}
        >
            <Flex vertical align="center" className="py-3">
                {validity === 'VALID' ? (
                    <>
                        <Result
                            className="md:w-3/6 p-0 -mt-3"
                            icon={<Lottie options={defaultOptions} height={100} />}
                            status="success"
                        />
                        <Typography.Text className="text-xl font-medium -mt-3">
                            {data?.serviceName} Details
                        </Typography.Text>
                        <Typography.Text className="text-sm font-normal text-stone-400 text-center block mx-auto">
                            We have fetched {data?.serviceName} details from official records.
                            Ensure this {data?.serviceName} belongs to you.
                        </Typography.Text>
                    </>
                ) : (
                    <>
                        <Result
                            className="md:w-3/6 p-0 -mt-3"
                            // icon={<Lottie options={defaultOptions} height={100} />}
                            status="error"
                        />
                        <Typography.Text className="text-xl font-medium">
                            {data?.serviceName} is {capitalizeFirstLetter(validity ?? '')}
                        </Typography.Text>
                    </>
                )}
                {currentInputConfig && validity !== 'VALID' && (
                    <>
                        {dynamicGroupedInputDetails.map((pair, index) => (
                            <Flex key={index} justify="space-between" className="w-full px-5 mt-5">
                                {pair.map((item, idx) => (
                                    <Flex vertical gap={7} key={idx}>
                                        <Typography.Text className="text-xs text-gray-500">
                                            {item.label}
                                        </Typography.Text>
                                        <Typography.Text className="font-medium w-96">
                                            {capitalizeFirstLetter(item.value)}
                                        </Typography.Text>
                                    </Flex>
                                ))}
                                {pair.length < 2 && <div style={{ width: '9rem' }} />}
                            </Flex>
                        ))}
                    </>
                )}
                <Flex className="w-full px-4 -mt-1">
                    <Divider />
                </Flex>

                {currentConfig && validity === 'VALID' && (
                    <>
                        {dynamicGroupedDetails.map((pair, index) => (
                            <Flex key={index} justify="space-between" className="w-full px-5 mt-5">
                                {pair.map((item: any, idx: any) => (
                                    <Flex vertical gap={7} key={idx}>
                                        <Typography.Text className="text-xs text-gray-500">
                                            {item.label}
                                        </Typography.Text>

                                        <Typography.Text className="font-medium w-96">
                                            {capitalizeFirstLetter(item.value)}
                                        </Typography.Text>
                                    </Flex>
                                ))}
                                {pair.length < 2 && <div style={{ width: '9rem' }} />}
                            </Flex>
                        ))}
                    </>
                )}

                <Flex vertical className="w-full px-5 mt-3" gap={8}>
                    <Typography.Text className="text-xs text-gray-500">Status</Typography.Text>
                    <Badge
                        status={validity === 'VALID' ? 'success' : 'error'}
                        text={capitalizeFirstLetter(validity ?? '')}
                        className="px-2 rounded-2xl"
                        style={{
                            color: badgeColor,
                            backgroundColor: badgeBg,
                            padding: '1px 9px',
                            borderRadius: '15px',
                        }}
                    />
                </Flex>
                {validity !== 'INVALID' && (
                    <Flex className="w-full px-5 mt-6" justify="end" gap={10}>
                        <Button onClick={handleCancel} className="text-gray-500">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            danger
                            loading={isLoading}
                            onClick={async () => {
                                await handleSave();
                                handleCancel();
                            }}
                        >
                            Proceed
                        </Button>
                    </Flex>
                )}
                {validity === 'INVALID' && (
                    <Flex className="w-full px-5 mt-6" justify="end" gap={10}>
                        <Button danger onClick={handleCancel}>
                            Try Again
                        </Button>
                    </Flex>
                )}
            </Flex>
        </Modal>
    );
};

export default VerificationModal;
