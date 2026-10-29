import React from 'react';

import { CloseCircleFilled } from '@ant-design/icons';
import { Badge, Col, Flex, List, Result, Row, Typography } from 'antd';
import Lottie from 'react-lottie';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly } from '@utils/dateFormat';

import ArrayDetailsCard from '../components/ArrayDetailsCard';
import { verificationConfigNew, InputConfigNew } from '../utils/data';

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

const Details = () => {
    const { verificationResponse: record } = useAppSelector(
        state => state.reducer.verificationSuite
    );
    const serviceKey = record?.accessKey;
    const normalizedResult = normalizeResponsePayload(serviceKey, record?.responsePayload);
    const inputPayload = record?.inputPayload || {};

    const getBase64Image = (base64String: string) => {
        if (base64String.startsWith('data:image')) {
            return base64String; // Already has the correct prefix
        }
        return `data:image/jpeg;base64,${base64String}`; // Prepend prefix if missing (assuming JPEG)
    };

    // for response data
    const currentConfig = verificationConfigNew[serviceKey];
    const dynamicGroupedDetails: { label: string; value: string }[][] = [];
    let currentRawData: any;

    if (currentConfig) {
        const rawData = currentConfig.getData(normalizedResult, undefined);
        currentRawData = rawData;
        const flatList = [
            {
                label: 'Verification Date',
                value: formattedDateOnly(new Date(record?.createdAt || new Date())),
            },
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
    const dynamicGroupedInputDetails: { label: string; value: string }[][] = [];

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

    let validity;
    if (currentConfig?.getValidityStatus) {
        validity = currentConfig.getValidityStatus(normalizedResult, undefined);
    } else {
        validity = record?.status === 'VALID' ? 'VALID' : 'INVALID'; // fallback if not provided
    }

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

    const capitalizeFirstLetter = (input: string | number): string | number => {
        if (typeof input === 'number') return input;
        if (!input || input.trim() === '') return 'N/A';

        const lowercaseWords = ['is', 'or', 'and', 'of', 'the', 'in', 'on'];

        // Special case override
        const normalizedInput = input.replace(/_+/g, ' ').trim().toLowerCase();
        if (normalizedInput === 'account is valid') return 'Account is valid';

        return input
            .replace(/_+/g, ' ') // replace underscores with space
            .replace(/,+/g, ',') // collapse multiple commas
            .replace(/,\s*/g, ', ') // ensure one space after commas
            .replace(/\s+/g, ' ') // normalize spaces
            .trim()
            .split(/([\s,-]+)/) // keep separators
            .map((part, index) => {
                if (/\d/.test(part)) return part;
                const lower = part.trim().toLowerCase();
                if (lowercaseWords.includes(lower)) return lower;
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            })
            .join('');
    };

    const formatVerificationType = (type: string): string => {
        if (!type) return 'N/A';

        let formattedType = type.replace(/\bId\b/g, 'ID');

        if (formattedType === 'Aadhar Card') {
            formattedType = 'Aadhaar OKYC';
        }
        if (formattedType === 'Director Verify CIN') {
            formattedType = 'Director Details from CIN';
        }
        if (formattedType === 'Director Verify DIN') {
            formattedType = 'Director Details from DIN';
        }
        if (formattedType === 'GSTIN with PAN') {
            formattedType = 'Fetch GSTIN from PAN';
        }
        if (formattedType === 'Advance PAN Verification') {
            formattedType = 'Advance PAN';
        }

        return formattedType;
    };
    const formattedType = formatVerificationType(record?.verificationType);
    const shouldShowValidity = !['Director Details from CIN', 'Director Details from DIN'].includes(
        formattedType
    );

    const renderResultValue = (item: { label: string; value: any }) => {
        if (serviceKey === 'aadhar_verify' && item.label === 'Photo') {
            return item.value && item.value !== '-' ? (
                <img
                    src={`data:image/jpeg;base64,${item.value}`}
                    alt="Aadhaar"
                    className="object-cover w-24 h-24 rounded-md"
                />
            ) : (
                'N/A'
            );
        }
        if (serviceKey === 'aadhar_verify' && item.label === 'e-Aadhaar PDF') {
            return item.value && item.value !== '-' ? (
                <a href={item.value} target="_blank" rel="noopener noreferrer" download>
                    Download e-Aadhaar
                </a>
            ) : (
                'N/A'
            );
        }
        if (item.label === 'Gender') {
            // capitalizeFirstLetter only capitalizes the first character (e.g. "M/F"
            // becomes "M/f" since '/' isn't treated as a word separator) — gender
            // codes should just be shown fully uppercased instead.
            return typeof item.value === 'string' && item.value.trim() !== '' && item.value !== '-'
                ? item.value.toUpperCase()
                : 'N/A';
        }
        if (item.label === 'Image Link' || item.label.trim() === 'Image') {
            return (
                <a
                    href={getBase64Image(item.value)}
                    download={`${formattedType}_Photo.jpeg`}
                    rel="noopener noreferrer"
                >
                    {`${formattedType} Photo`}
                </a>
            );
        }
        if (typeof item.value === 'string' && item.value.includes('\n')) {
            return (
                <Flex vertical>
                    {item.value.split('\n').map((line, lineIdx) => (
                        <Typography.Text key={lineIdx}>{line}</Typography.Text>
                    ))}
                </Flex>
            );
        }
        return capitalizeFirstLetter(item.value);
    };

    return (
        <Row>
            <Col span={24} className="border rounded-2xl p-5">
                <Flex vertical>
                    {validity === 'VALID' ? (
                        <Flex vertical gap={5}>
                            <Flex align="center">
                                {isNameMismatchWarning ? (
                                    <Result className="p-0" status="warning" />
                                ) : (
                                    <Result
                                        className="p-0"
                                        icon={<Lottie options={defaultOptions} height={38} />}
                                        status="success"
                                    />
                                )}
                                {isNameMismatchWarning && (
                                    <Typography.Text className="text-xl font-medium">
                                        {isBankNameMismatch
                                            ? record?.message ||
                                              'Account verified but name mismatched.'
                                            : panMismatchMessage}
                                    </Typography.Text>
                                )}
                                {!isNameMismatchWarning && serviceKey === 'gstin_pan' && (
                                    <Typography.Text className="text-xl font-medium">
                                        GSTINs Fetched Successfully
                                    </Typography.Text>
                                )}
                                {!isNameMismatchWarning && serviceKey !== 'gstin_pan' && (
                                    <Typography.Text className="text-xl font-medium">
                                        {formattedType}
                                        {shouldShowValidity &&
                                            ` is ${capitalizeFirstLetter(validity)}`}
                                    </Typography.Text>
                                )}
                            </Flex>
                            {record?.referenceNumber && (
                                <Flex className="w-full mt-1 xs:justify-start justify-between md:justify-start">
                                    <Typography.Text className="text-gray-600 md:w-1/4">
                                        {formattedType} Ref ID:
                                    </Typography.Text>
                                    <Typography.Text className="text-gray-600 font-medium xs:ml-2 sm:ml-0 md:ml-5">
                                        {record?.referenceNumber}
                                    </Typography.Text>
                                </Flex>
                            )}

                            <Flex className="w-full mt-2 xs:justify-start justify-between md:justify-start">
                                <Typography.Text className="text-gray-600 sm:w-1/4">
                                    {formattedType} status:
                                </Typography.Text>
                                <Badge
                                    status={validity === 'VALID' ? 'success' : 'error'}
                                    text={capitalizeFirstLetter(validity)}
                                    className="px-2 rounded-2xl xs:ml-2 sm:ml-0 md:ml-5"
                                    style={{
                                        color: badgeColor,
                                        backgroundColor: badgeBg,
                                        padding: '1px 9px',
                                        borderRadius: '15px',
                                    }}
                                />
                            </Flex>
                            <Flex className="w-full mt-2 xs:justify-start justify-between md:justify-start">
                                <Typography.Text className="text-gray-600 sm:w-1/4">
                                    Message:
                                </Typography.Text>
                                {serviceKey === 'gstin_pan' ? (
                                    <Typography.Text className="text-gray-600 font-medium xs:ml-2 sm:ml-0 md:ml-5">
                                        GSTINs Fetched Successfully
                                    </Typography.Text>
                                ) : (
                                    <Typography.Text className="text-gray-600 font-medium xs:ml-2 sm:ml-0 md:ml-5">
                                        {record?.message ||
                                            normalizedResult?.message ||
                                            normalizedResult?.remarks ||
                                            `${formattedType} verified successfully`}
                                    </Typography.Text>
                                )}
                            </Flex>
                        </Flex>
                    ) : (
                        <Flex vertical gap={5}>
                            <Flex align="center" gap={10}>
                                <Result
                                    className="p-0 "
                                    icon={<CloseCircleFilled style={{ fontSize: 38, color: '#ff4d4f' }} />}
                                    status="error"
                                />
                                {serviceKey === 'gstin_pan' ? (
                                    <Typography.Text className="text-xl font-medium">
                                        GSTINs not found
                                    </Typography.Text>
                                ) : (
                                    <Typography.Text className="text-xl font-medium">
                                        {formattedType}
                                        {shouldShowValidity &&
                                            ` is ${capitalizeFirstLetter(validity)}`}
                                    </Typography.Text>
                                )}
                            </Flex>
                            <Flex className="w-full mt-3 xs:justify-start justify-between md:justify-start">
                                <Typography.Text className="text-gray-600 w-1/4">
                                    {formattedType} Ref ID:
                                </Typography.Text>
                                <Typography.Text className="text-gray-600 font-medium xs:ml-2 sm:ml-0 md:ml-5 ">
                                    {record?.referenceNumber}
                                </Typography.Text>
                            </Flex>
                            <Flex className="w-full mt-2 xs:justify-start justify-between md:justify-start">
                                <Typography.Text className="text-gray-600 w-1/4">
                                    {formattedType} status:
                                </Typography.Text>
                                <Badge
                                    status={validity === 'VALID' ? 'success' : 'error'}
                                    text={capitalizeFirstLetter(validity)}
                                    className="px-2 rounded-2xl xs:ml-2 sm:ml-0 md:ml-5"
                                    style={{
                                        color: badgeColor,
                                        backgroundColor: badgeBg,
                                        padding: '1px 9px',
                                        borderRadius: '15px',
                                    }}
                                />
                            </Flex>
                            <Flex className="w-full  mt-2 xs:justify-start justify-between md:justify-start">
                                <Typography.Text className="text-gray-600 w-1/4">
                                    Message
                                </Typography.Text>
                                {serviceKey === 'gstin_pan' ? (
                                    <Typography.Text className="text-gray-600 font-medium xs:ml-2 sm:ml-0 md:ml-5">
                                        GSTINs not found
                                    </Typography.Text>
                                ) : (
                                    <Typography.Text className="text-gray-600 font-medium xs:ml-2 sm:ml-0 md:ml-5">
                                        {record?.message ||
                                            normalizedResult?.message ||
                                            ` ${formattedType} not exists`}
                                    </Typography.Text>
                                )}
                            </Flex>
                        </Flex>
                    )}
                </Flex>
            </Col>
            <Col span={24} className="border rounded-2xl p-5 mt-5">
                {currentInputConfig && (
                    <>
                        <Typography.Text className="font-medium">Details Provided</Typography.Text>
                        <List
                            className="mt-3"
                            dataSource={dynamicGroupedInputDetails.flat()}
                            renderItem={(item, index) => (
                                <Row
                                    className={`py-4 px-6 ${index % 2 === 0 ? 'bg-listBg' : 'bg-white'} ${index === dynamicGroupedInputDetails.flat().length - 1 ? '' : 'border-none'}`}
                                    key={index}
                                >
                                    <Col span={24}>
                                        <Flex className="flex flex-col sm:flex-row">
                                            <div className="w-full sm:w-1/4">
                                                <Typography.Text className="text-gray-600 ">
                                                    {item.label}
                                                </Typography.Text>
                                            </div>
                                            <Flex
                                                gap={20}
                                                align="center"
                                                className="justify-between md:justify-start xs:ml-0 md:ml-5"
                                            >
                                                <Typography.Text className="text-gray-600 font-medium ">
                                                    {capitalizeFirstLetter(item.value)}
                                                </Typography.Text>
                                            </Flex>
                                        </Flex>
                                    </Col>
                                </Row>
                            )}
                        />
                    </>
                )}

                <Flex className="w-full gap-3" vertical>
                    <Typography.Text className="font-medium pt-5">
                        Verification Details
                    </Typography.Text>

                    <Row gutter={24}>
                        {dynamicGroupedDetails.flat().length > 7 ? (
                            <>
                                <Col xs={24} md={12}>
                                    <List
                                        className="mt-3"
                                        dataSource={dynamicGroupedDetails
                                            .flat()
                                            .slice(
                                                0,
                                                Math.ceil(dynamicGroupedDetails.flat().length / 2)
                                            )}
                                        renderItem={(item, index) =>  (
                                                <Row
                                                    className={`py-4 px-6 ${index % 2 === 0 ? 'bg-listBg' : 'bg-white'} border-none`}
                                                    key={index}
                                                >
                                                    <Col span={24}>
                                                        <Flex className="flex flex-col sm:flex-row">
                                                            <div className="w-full sm:w-3/6  ">
                                                                <Typography.Text className="text-gray-600">
                                                                    {item.label}
                                                                </Typography.Text>
                                                            </div>
                                                            <Flex
                                                                gap={20}
                                                                align="center"
                                                                className="justify-between md:justify-start w-64"
                                                            >
                                                                <Typography.Text className="text-gray-600 font-medium xs:ml-0 xl:ml-10  ">
                                                                    {renderResultValue(item)}
                                                                </Typography.Text>
                                                            </Flex>
                                                        </Flex>
                                                    </Col>
                                                </Row>
                                            )
                                        }
                                    />
                                </Col>

                                <Col xs={24} md={12}>
                                    <List
                                        className="mt-3"
                                        dataSource={dynamicGroupedDetails
                                            .flat()
                                            .slice(
                                                Math.ceil(dynamicGroupedDetails.flat().length / 2)
                                            )}
                                        renderItem={(item, index) => (
                                            <Row
                                                className={`py-4 px-6 ${index % 2 === 0 ? 'bg-listBg' : 'bg-white'} border-none`}
                                                key={index}
                                            >
                                                <Col span={24}>
                                                    <Flex className="flex flex-col sm:flex-row">
                                                        <div className="w-full sm:w-3/6">
                                                            <Typography.Text className="text-gray-600">
                                                                {item.label}
                                                            </Typography.Text>
                                                        </div>
                                                        <Flex
                                                            gap={20}
                                                            align="center"
                                                            className="justify-between md:justify-start w-64"
                                                        >
                                                            <Typography.Text className="text-gray-600 font-medium xs:ml-0 xl:ml-10">
                                                                {renderResultValue(item)}
                                                            </Typography.Text>
                                                        </Flex>
                                                    </Flex>
                                                </Col>
                                            </Row>
                                        )}
                                    />
                                </Col>
                            </>
                        ) : (
                            <Col span={24}>
                                <List
                                    className="mt-3"
                                    dataSource={dynamicGroupedDetails.flat()}
                                    renderItem={(item, index) => (
                                        <Row
                                            className={`py-4 px-6 ${index % 2 === 0 ? 'bg-listBg' : 'bg-white'} border-none`}
                                            key={index}
                                        >
                                            <Col span={24}>
                                                <Flex className="flex flex-col sm:flex-row">
                                                    <div className="w-full sm:w-1/4">
                                                        <Typography.Text className="text-gray-600 ">
                                                            {item.label}
                                                        </Typography.Text>
                                                    </div>
                                                    <Flex
                                                        gap={20}
                                                        align="center"
                                                        className="justify-between md:justify-start"
                                                    >
                                                        <Typography.Text className="text-gray-600 font-medium  xs:ml-0 md:ml-5 ">
                                                            {renderResultValue(item)}
                                                        </Typography.Text>
                                                    </Flex>
                                                </Flex>
                                            </Col>
                                        </Row>
                                    )}
                                />
                            </Col>
                        )}
                    </Row>
                </Flex>
            </Col>
            <Col span={24} className="mt-5">
                {serviceKey === 'gstin_pan' && gstinList?.length > 0 && (
                    <>
                        <Typography.Text className=" text-gray-500 mt-5">
                            Linked GSTINs
                        </Typography.Text>

                        <Row gutter={[20, 20]}>
                            {gstinList.map((gst: any, index: number) => (
                                //    <Flex
                                //        key={index}
                                //        vertical
                                //        className="w-full px-5 py-3 mt-3 border rounded-lg"
                                //        style={{
                                //            borderColor: '#e5e7eb',
                                //            backgroundColor: '#f9fafb',
                                //        }}
                                //        gap={10}
                                //    >

                                <Col span={12}>
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
                                </Col>

                                //    </Flex>
                            ))}
                        </Row>
                    </>
                )}

                {[
                    'director_verify_cin',
                    'corporate_verify',
                    'director_verify_din',
                    'gst_return_check',
                ].includes(serviceKey) && (
                    <Row>
                      
                            <ArrayDetailsCard
                                data={normalizedResult}
                                serviceKey={serviceKey}
                            />
                
                    </Row>
                )}
            </Col>
        </Row>
    );
};

export default Details;
