/* eslint-disable no-nested-ternary */
/* eslint-disable prefer-const */
import { CloseOutlined } from '@ant-design/icons';
import { Badge, Divider, Flex, Modal, Result, Typography } from 'antd';
import Lottie from 'react-lottie';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { InputConfigNew, verificationConfigNew } from '@src/domains/dashboard/verificationSuite/utils/data';

import ArrayDetailsCard from '../employeeDetails/ArrayDetailsCard';



type modalProps = {
    isOpen: boolean;
    handleCancel: () => void;
    data?: any;
    responseData?: any;
    formValues?: any;
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

const SuccessModal = ({ isOpen, handleCancel, data, responseData, formValues }: modalProps) => {
   


    const serviceKey = responseData?.orderResponse?.InputDetails?.Accesskey || data?.accessKey;

    // for response data
    const currentConfig = verificationConfigNew[serviceKey];
    let dynamicGroupedDetails: { label: string; value: string }[][] = [];

    if (currentConfig) {
        const rawData = currentConfig.getData(data, responseData);
        const flatList = [
            // {
            //     label: 'Verification Date',
            //     value: formattedDateOnly(
            //         new Date(data?.datetime || responseData?.createdAt || new Date())
            //     ),
            // },
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
        const rawData = currentInputConfig.getData(formValues, data);

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
        ? currentConfig.getValidityStatus(data, responseData)
        : 'INVALID'; // fallback if not provided

    const badgeColor = validity === 'VALID' ? '#16a34a' : '#dc2626';
    const badgeBg = validity === 'VALID' ? '#d1fae5' : '#fee2e2';
    const gstinList = responseData?.orderResponse?.Result?.gstin_list || data?.gstin_list || [];

    const capitalizeFirstLetter = (input: string | number): string | number => {
        if (typeof input === 'number') return input;

        // Don't modify if input contains any number
        if (/\d/.test(input)) return input;

        if (!input) return '';
        const lowercaseWords = ['is', 'or', 'and', 'of', 'the', 'in', 'on'];

        return input
            .toString() // Ensure the input is a string
            .replace(/_/g, ' ') // Replace underscores with spaces
            .toLowerCase() // Convert the entire string to lowercase
            .split(' ') // Split the string by spaces
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
            .map((part, index) => {
                if (/\d/.test(part)) return part;
                const lower = part.trim().toLowerCase();
                if (lowercaseWords.includes(lower)) return lower;
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            })
            .join(' '); // Join the words back with spaces
    };
    const formatVerificationType = (type: string): string => {
        if (!type) return 'N/A';

        let formattedType = type.replace(/\bId\b/g, 'ID');

        if (formattedType === "Director's CIN") {
            formattedType = 'Director Details from CIN';
        }
        if (formattedType === "Director's DIN") {
            formattedType = 'Director Details from DIN';
        }

        return formattedType;
    };
    const formattedType = formatVerificationType(
        data?.serviceName || responseData?.VerificationType
    );
    const shouldShowValidity = !['Director Details from CIN', 'Director Details from DIN'].includes(
        formattedType
    );

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
                            className="p-0 -mt-3 md:w-3/6"
                            icon={<Lottie options={defaultOptions} height={100} />}
                            status="success"
                        />
                        {serviceKey === 'gstin_pan' ? (
                            <Typography.Text className="-mt-3 text-xl font-medium">
                                GSTINs Fetched Successfully
                            </Typography.Text>
                        ) : (
                            <Typography.Text className="-mt-3 text-xl font-medium">
                                {formattedType}
                                {shouldShowValidity && ` is ${capitalizeFirstLetter(validity)}`}
                            </Typography.Text>
                        )}
                    </>
                ) : (
                    <>
                        <Result
                            className="p-0 -mt-3 md:w-3/6"
                            // icon={<Lottie options={defaultOptions} height={100} />}
                            status="error"
                        />
                        {serviceKey === 'gstin_pan' ? (
                            <Typography.Text className="text-xl font-medium">
                                GSTINs not found
                            </Typography.Text>
                        ) : (
                            <Typography.Text className="text-xl font-medium">
                                {formattedType}
                                {shouldShowValidity && ` is ${capitalizeFirstLetter(validity)}`}
                            </Typography.Text>
                        )}
                    </>
                )}

                {currentInputConfig && (
                    <>
                        {dynamicGroupedInputDetails.map((pair, index) => (
                            <Flex
                                key={index}
                                justify="space-between"
                                className="w-full px-5 mt-5 flex-col sm:flex-row sm:items-start gap-5"
                            >
                                {pair.map((item, idx) => (
                                    <Flex vertical gap={7} key={idx}>
                                        <Typography.Text className="text-xs text-gray-500">
                                            {item.label}
                                        </Typography.Text>
                                        <Typography.Text className="font-medium w-full xs:w-64 sm:80 xl:w-96">
                                            {capitalizeFirstLetter(item.value)}
                                        </Typography.Text>
                                    </Flex>
                                ))}
                                {pair.length < 2 && (
                                    <div className="hidden sm:block" style={{ width: '9rem' }} />
                                )}
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
                            <Flex
                                key={index}
                                justify="space-between"
                                className="w-full px-5 mt-5 flex-col sm:flex-row sm:items-start gap-5"
                            >
                                {pair.map((item: any, idx: any) => (
                                    <Flex vertical gap={7} key={idx}>
                                        <Typography.Text className="text-xs text-gray-500">
                                            {item.label}
                                        </Typography.Text>

                                        {/* Handling Aadhar OCR Verification */}
                                        {serviceKey === 'aadhar_ocr_verify' ? (
                                            <>
                                                {item.label === 'Ref.ID' ? (
                                                    <Typography.Text className="font-medium w-96">
                                                        {capitalizeFirstLetter(item.value)}
                                                    </Typography.Text>
                                                ) : (
                                                    <a
                                                        href={item.value}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="text-blue-800 w-96 "
                                                    >
                                                        Masked Aadhaar
                                                    </a>
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
                                        ) : (
                                            // Default rendering for other fields
                                            <Typography.Text className="font-medium xs:w-64 sm:80 xl:w-96">
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
                                <Typography.Text className="px-5 mt-5 text-xs text-gray-500">
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
                            'gst_return_check',
                        ].includes(serviceKey) && (
                                <ArrayDetailsCard isSuccessModal data={data} serviceKey={serviceKey} />
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
