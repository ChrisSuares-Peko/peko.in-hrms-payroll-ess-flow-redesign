/* eslint-disable no-nested-ternary */
/* eslint-disable prefer-const */
import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Badge, Divider, Flex, Modal, Result, Typography } from 'antd';
import Lottie from 'react-lottie';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import ArrayDetailsCard from '@src/domains/dashboard/verificationSuite/components/ArrayDetailsCard';
import {
    InputConfigNew,
    verificationConfigNew,
} from '@src/domains/dashboard/verificationSuite/utils/data';

type modalProps = {
    isOpen: boolean;
    handleCancel: () => void;
    responseData?: any;
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

// PAN's history responsePayload nests the real fields under StatusDesc with
// different names than the live-verify shape verificationConfigNew.pan_verify expects.
const normalizeResponsePayload = (accessKey: string, responsePayload: any) => {
    if (!responsePayload) return {};
    if (accessKey === 'pan_verify') {
        const statusDesc = responsePayload.StatusDesc || {};
        return {
            panStatus: statusDesc.status,
            remarks: statusDesc.remarks,
            nameMatch: statusDesc.name_as_per_pan_match,
            dateOfBirthMatch: statusDesc.date_of_birth_match,
        };
    }
    if (accessKey === 'gstin_pan') {
        // GST-by-PAN history nests the real fields under StatusDesc[0].data,
        // unlike the flat shape verificationConfigNew.gstin_pan expects from the live verify call.
        const entry = Array.isArray(responsePayload.StatusDesc)
            ? responsePayload.StatusDesc[0]
            : responsePayload.StatusDesc;
        return entry?.data || {};
    }
    if (accessKey === 'bank_account_verify') {
        // Bank account history stores the raw gateway field names, unlike the flat
        // camelCase shape verificationConfigNew.bank_account_verify expects from the live verify call.
        return {
            accountHolderName: responsePayload.BankResponse,
            isNameMatched: responsePayload.IsMatched,
            matchPercentage: responsePayload.Percentage,
        };
    }
    return responsePayload;
};

const SuccessModal = ({ isOpen, handleCancel, responseData }: modalProps) => {
    const serviceKey = responseData?.accessKey;
    const normalizedResult = normalizeResponsePayload(serviceKey, responseData?.responsePayload);
    const inputPayload = responseData?.inputPayload || {};

    const formatVerificationType = (type: string): string => {
        if (!type) return 'N/A';

        let formattedType = type.replace(/\bId\b/g, 'ID');

        if (formattedType === 'Aadhar Card' || formattedType === 'Aadhaar OCR') {
            formattedType = 'Aadhaar';
        }
        if (formattedType === 'Director Verify CIN') {
            formattedType = "Director's CIN";
        }
        if (formattedType === 'Director Verify DIN') {
            formattedType = "Director's DIN";
        }
        if (formattedType === 'GSTIN with PAN') {
            formattedType = 'Fetch GSTIN from PAN';
        }
        if (formattedType === 'Fetch GSTIN from PAN') {
            formattedType = 'GSTIN';
        }
        if (formattedType === 'Advance PAN') {
            formattedType = 'PAN';
        }

        return formattedType;
    };
    // for response data
    const currentConfig = verificationConfigNew[serviceKey];
    let dynamicGroupedDetails: { label: string; value: string }[][] = [];
    let currentRawData: any;

    if (currentConfig) {
        const rawData = currentConfig.getData(normalizedResult, undefined);
        currentRawData = rawData;
        const flatList = [
            ...currentConfig.fields.map(({ label, key }) => {
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
        const rawData = currentInputConfig.getData(inputPayload, undefined);

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


    const validity = currentConfig?.getValidityStatus
        ? currentConfig.getValidityStatus(normalizedResult, undefined)
        : responseData?.status === 'VALID'
          ? 'VALID'
          : 'INVALID'; // fallback if not provided

    // Bank account verify's overall status is Valid once the account itself is
    // resolved (see verificationConfigNew.bank_account_verify.getValidityStatus).
    // A name mismatch doesn't change that status — it's surfaced only as an
    // amber warning icon/message instead of the usual green success one.
    const isBankNameMismatch =
        serviceKey === 'bank_account_verify' && currentRawData?.isNameMatched === 'No';

    // PAN verify can likewise return panStatus: valid while the name/date of
    // birth don't match the PAN records — same treatment: stays Valid overall,
    // amber warning icon/message instead of the green success one.
    const isMismatchText = (value: any) =>
        typeof value === 'string' && value.toLowerCase().includes('does not match');
    const panMismatchFields = [
        isMismatchText(currentRawData?.nameMatch) && 'name',
        isMismatchText(currentRawData?.dateOfBirthMatch) && 'date of birth',
    ].filter(Boolean);
    const isPanMismatch =
        serviceKey === 'pan_verify' && validity === 'VALID' && panMismatchFields.length > 0;
    const panMismatchMessage = `PAN is valid but the ${panMismatchFields.join(' and ')} ${
        panMismatchFields.length > 1 ? 'do' : 'does'
    } not match.`;

    const isNameMismatchWarning = isBankNameMismatch || isPanMismatch;

    const badgeColor = validity === 'VALID' ? '#16a34a' : '#dc2626';
    const badgeBg = validity === 'VALID' ? '#d1fae5' : '#fee2e2';
    const gstinList = normalizedResult?.gstin_list || [];
    const showDetailsBlock = currentConfig && validity === 'VALID';

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
                {isNameMismatchWarning && (
                    <>
                        <Result className="md:w-3/6 p-0 -mt-3" status="warning" />
                        <Typography.Text className="text-xl font-medium">
                            {isBankNameMismatch
                                ? responseData?.message || 'Account verified but name mismatched.'
                                : panMismatchMessage}
                        </Typography.Text>
                    </>
                )}
                {!isNameMismatchWarning && validity === 'VALID' && (
                    <>
                        <Result
                            className="md:w-3/6 p-0 -mt-3"
                            icon={<Lottie options={defaultOptions} height={100} />}
                            status="success"
                        />
                        <Typography.Text className="text-xl font-medium -mt-3">
                            {formatVerificationType(responseData?.verificationType)}{' '}
                            is {capitalizeFirstLetter(validity)}.
                        </Typography.Text>
                    </>
                )}
                {!isNameMismatchWarning && validity !== 'VALID' && (
                    <>
                        <Result
                            className="md:w-3/6 p-0 -mt-3"
                            // icon={<Lottie options={defaultOptions} height={100} />}
                            status="error"
                        />
                        <Typography.Text className="text-xl font-medium">
                            {formatVerificationType(responseData?.verificationType)}{' '}
                            is {capitalizeFirstLetter(validity)}.
                        </Typography.Text>
                    </>
                )}

                {currentInputConfig && (
                    <>
                        {dynamicGroupedInputDetails.map((pair, index) => (
                            <Flex key={index} justify="space-between" className="w-full px-5 mt-5">
                                {pair.map((item, idx) => (
                                    <Flex vertical gap={7} key={idx}>
                                        <Typography.Text className="text-xs text-gray-500">
                                            {item.label}
                                        </Typography.Text>
                                        <Typography.Text className="font-medium w-96 break-words">
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

                {showDetailsBlock && (
                    <>
                        {dynamicGroupedDetails.map((pair, index) => (
                            <Flex key={index} justify="space-between" className="w-full px-5 mt-5">
                                {pair.map((item: any, idx: any) => (
                                    <Flex vertical gap={7} key={idx}>
                                        <Typography.Text className="text-xs text-gray-500">
                                            {item.label}
                                        </Typography.Text>

                                        {/* Handling Aadhar OCR Verification */}
                                        {serviceKey === 'aadhar_ocr_verify' ? (
                                            <>
                                                {item.label === 'Ref.ID' ? (
                                                    <Typography.Text className="font-medium w-96 break-words">
                                                        {capitalizeFirstLetter(item.value)}
                                                    </Typography.Text>
                                                ) : (
                                                    <a
                                                        href={item.value}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="w-96 break-words text-blue-800 "
                                                    >
                                                        Masked Aadhaar
                                                    </a>
                                                )}
                                            </>
                                        ) : serviceKey === 'aadhar_verify' &&
                                          (item.label === 'Photo' ||
                                              item.label === 'e-Aadhaar PDF') ? (
                                            <>
                                                {item.label === 'Photo' ? (
                                                    item.value && item.value !== '-' ? (
                                                        <img
                                                            src={`data:image/jpeg;base64,${item.value}`}
                                                            alt="Aadhaar"
                                                            className="object-cover w-24 h-24 rounded-md"
                                                        />
                                                    ) : (
                                                        <Typography.Text className="font-medium">
                                                            -
                                                        </Typography.Text>
                                                    )
                                                ) : item.value && item.value !== '-' ? (
                                                    <a
                                                        href={item.value}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="w-96 break-words text-blue-800 "
                                                    >
                                                        Download e-Aadhaar
                                                    </a>
                                                ) : (
                                                    <Typography.Text className="font-medium">
                                                        -
                                                    </Typography.Text>
                                                )}
                                            </>
                                        ) : item.label === 'Driving License Validity' ? (
                                            // Render Driving License Validity
                                            <>
                                                <Flex vertical>
                                                    <Typography.Text className="font-medium">
                                                        {' '}
                                                        {item.value?.non_transport?.from} to{' '}
                                                        {item.value?.non_transport?.to}{' '}
                                                        (Non-Transport)
                                                    </Typography.Text>
                                                </Flex>
                                                <Flex vertical>
                                                    {item.value?.transport?.from &&
                                                        item.value?.transport?.to && (
                                                            <Typography.Text className="font-medium">
                                                                {' '}
                                                                {
                                                                    item.value?.transport?.from
                                                                } to {item.value?.transport?.to}{' '}
                                                                (Transport)
                                                            </Typography.Text>
                                                        )}
                                                </Flex>
                                            </>
                                        ) : item.label === 'Gender' ? (
                                            // capitalizeFirstLetter only capitalizes the first
                                            // character (e.g. "M/F" becomes "M/f"), so gender
                                            // codes are shown fully uppercased instead.
                                            <Typography.Text className="font-medium w-96 break-words">
                                                {typeof item.value === 'string' &&
                                                item.value.trim() !== '' &&
                                                item.value !== '-'
                                                    ? item.value.toUpperCase()
                                                    : 'N/A'}
                                            </Typography.Text>
                                        ) : typeof item.value === 'string' &&
                                          item.value.includes('\n') ? (
                                            <Flex vertical className="w-96">
                                                {item.value
                                                    .split('\n')
                                                    .map((line: string, lineIdx: number) => (
                                                    <Typography.Text
                                                        key={lineIdx}
                                                        className="font-medium break-words"
                                                    >
                                                        {line}
                                                    </Typography.Text>
                                                ))}
                                            </Flex>
                                        ) : (
                                            // Default rendering for other fields
                                            <Typography.Text className="font-medium w-96 break-words">
                                                {capitalizeFirstLetter(item.value)}
                                            </Typography.Text>
                                        )}
                                    </Flex>
                                ))}
                                {pair.length < 2 && <div style={{ width: '9rem' }} />}
                            </Flex>
                        ))}

                        {/* ✅ Add this block for gstin_pan to render the gstin_list array */}
                        {serviceKey === 'gstin_pan' && gstinList?.length > 0 && (
                            <>
                                <Typography.Text className="text-xs text-gray-500 px-5 mt-5">
                                    Linked GSTINs
                                </Typography.Text>

                                {gstinList.map((gst: any, index: number) => (
                                    <Flex
                                        key={index}
                                        vertical
                                        className="w-full px-5 py-3 mt-3 border rounded-lg"
                                        style={{
                                            borderColor: '#e5e7eb',
                                            backgroundColor: '#f9fafb',
                                        }}
                                        gap={10}
                                    >
                                        <Flex justify="space-between">
                                            <Typography.Text className="text-xs text-gray-500">
                                                GSTIN
                                            </Typography.Text>
                                            <Typography.Text className="font-medium">
                                                {capitalizeFirstLetter(gst.gstin)}
                                            </Typography.Text>
                                        </Flex>
                                        <Flex justify="space-between">
                                            <Typography.Text className="text-xs text-gray-500">
                                                State
                                            </Typography.Text>
                                            <Typography.Text className="font-medium">
                                                {capitalizeFirstLetter(gst.state)}
                                            </Typography.Text>
                                        </Flex>
                                        <Flex justify="space-between">
                                            <Typography.Text className="text-xs text-gray-500">
                                                Status
                                            </Typography.Text>
                                            <Typography.Text className="font-medium">
                                                {capitalizeFirstLetter(gst.status)}
                                            </Typography.Text>
                                        </Flex>
                                    </Flex>
                                ))}
                            </>
                        )}

                        {[
                            'director_verify_cin',
                            'corporate_verify',
                            'director_verify_din',
                        ].includes(serviceKey) && (
                            <ArrayDetailsCard data={normalizedResult} serviceKey={serviceKey} />
                        )}
                    </>
                )}

                <Flex vertical className="w-full px-5 mt-3" gap={8}>
                    <Typography.Text className="text-xs text-gray-500">Status</Typography.Text>
                    <Badge
                        status={validity === 'VALID' ? 'success' : 'error'}
                        text={capitalizeFirstLetter(validity)}
                        className="px-2 rounded-2xl"
                        style={{
                            color: badgeColor,
                            backgroundColor: badgeBg,
                            padding: '1px 9px',
                            borderRadius: '15px',
                        }}
                    />
                </Flex>
            </Flex>
        </Modal>
    );
};

export default SuccessModal;
