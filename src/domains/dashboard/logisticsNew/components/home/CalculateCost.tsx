import { useState } from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Form, Row, Typography } from 'antd';
import { Formik } from 'formik';

import NumberWithUnit from '@components/atomic/inputs/NumberWIthUnit';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { RootState } from '@store/store';

import AddAddressModal from './AddAddressModal';
import AddressSelect from './AddressSelect';
import { lookupInternationalPostcodeApi, lookupPostcodeApi } from '../../api';
import { deleteAddressApi } from '../../api/address';
import { useSavedAddresses } from '../../hooks/home/useSavedAddresses';
import { calculateInternationalShipmentSchema, calculateShipmentSchema } from '../../schema';
import {
    updateDestinationAddress,
    updateOriginAddress,
    updateShipmentDetails,
} from '../../slice/logisticsSlice';
import { DeliveryCompanyOption, InternationalShipmentData, ShipmentData } from '../../types';
import { AddressFieldValue } from '../../types/address';

const { Text } = Typography;

const ORIGIN_ADDRESS_INVALID_MESSAGE =
    'Pickup address line 1 must be at least 10 characters and include a house / flat / road number. Please edit the address.';

const isPickupAddressValid = (addressLine?: string) => {
    const line = (addressLine || '').trim();
    return line.length >= 10 && /\d/.test(line);
};

interface Props {
    handleCalculateRate: (shipmentDetails: ShipmentData) => Promise<DeliveryCompanyOption[]>;
    handleCalculateInternationalRate: (
        shipmentDetails: InternationalShipmentData
    ) => Promise<DeliveryCompanyOption[]>;
    isLoading: boolean;
    hideAndResetWhileChange: () => void;
}

const CalculateCost = ({
    handleCalculateRate,
    handleCalculateInternationalRate,
    isLoading,
    hideAndResetWhileChange,
}: Props) => {
    const { shipmentType, shipmentDetails } = useAppSelector(
        (state: RootState) => state.reducer.logisticsV3
    );
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalIsReceiver, setModalIsReceiver] = useState(false);
    const [editAddressData, setEditAddressData] = useState<AddressFieldValue | undefined>(
        undefined
    );
    const [refreshKey, setRefreshKey] = useState(0);
    const [isOriginPinInvalid, setIsOriginPinInvalid] = useState(false);
    const [isDestinationPinInvalid, setIsDestinationPinInvalid] = useState(false);
    // Shiprocket rejects pickup addresses under 10 chars or without a house/flat/road no.
    const [isOriginAddressInvalid, setIsOriginAddressInvalid] = useState(false);

    const { options: senderOptions, parseAddress: parseSender } = useSavedAddresses(
        false,
        refreshKey
    );
    const { options: receiverOptions, parseAddress: parseReceiver } = useSavedAddresses(
        true,
        refreshKey
    );

    const openModal = (isReceiver: boolean) => {
        setEditAddressData(undefined);
        setModalIsReceiver(isReceiver);
        setModalOpen(true);
    };

    const openEditModal = (isReceiver: boolean, addressJson: string) => {
        const parsed = isReceiver ? parseReceiver(addressJson) : parseSender(addressJson);
        if (!parsed) return;
        setEditAddressData(parsed);
        setModalIsReceiver(isReceiver);
        setModalOpen(true);
    };

    const handleDeleteAddress = async (addressJson: string) => {
        try {
            const parsed = JSON.parse(addressJson);
            if (!parsed?.id) return;
            const ok = await deleteAddressApi({ userType: role, userId: id, addressId: parsed.id });
            if (ok) {
                dispatch(showToast({ description: 'Address deleted', variant: 'success' }));
                setRefreshKey(k => k + 1);
            } else {
                dispatch(showToast({ description: 'Failed to delete address', variant: 'error' }));
            }
        } catch {
            /* empty */
        }
    };

    const resetReduxState = () => {
        dispatch(
            updateShipmentDetails({
                originPostCode: '',
                originCity: { city: '', state: '' },
                destinationPostCode: '',
                destinationCity: { city: '', state: '' },
            })
        );
        dispatch(
            updateOriginAddress({
                senderName: '',
                senderEmail: '',
                senderPhone: '',
                senderAddressLine: '',
                senderAddressLine2: '',
                senderZipCode: '',
                senderAddressId: null,
            })
        );
        dispatch(
            updateDestinationAddress({
                receiverName: '',
                receiverEmail: '',
                receiverPhone: '',
                receiverAddressLine: '',
                receiverAddressLine2: '',
                receiverZipCode: '',
                receiverPhoneCode: '+91',
                receiverAddressId: null,
            })
        );
        hideAndResetWhileChange();
    };

    return (
        <div className="mt-6">
            <Card className="rounded-2xl shadow-sm" styles={{ body: { padding: '20px 24px' } }}>
                {/* Card header */}
                <Flex align="center" gap={12} className="mb-5">
                    <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M1.84961 4.33594L7.00043 7.31676L12.1163 4.35342"
                                stroke="#f87171"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M7 12.6033V7.3125"
                                stroke="#f87171"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M5.79285 1.44406L2.67785 3.17658C1.97202 3.56741 1.39453 4.5474 1.39453 5.3524V8.64825C1.39453 9.45325 1.97202 10.4332 2.67785 10.8241L5.79285 12.5566C6.45785 12.9241 7.54868 12.9241 8.21368 12.5566L11.3287 10.8241C12.0345 10.4332 12.612 9.45325 12.612 8.64825V5.3524C12.612 4.5474 12.0345 3.56741 11.3287 3.17658L8.21368 1.44406C7.54285 1.07073 6.45785 1.07073 5.79285 1.44406Z"
                                stroke="#f87171"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M9.91669 7.7223V5.58732L4.38086 2.39062"
                                stroke="#f87171"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div>
                        <Text className="font-semibold text-base block leading-tight">
                            Calculate Shipping Cost
                        </Text>
                        <Text className="text-xs text-gray-400">
                            Get an instant quote for your package
                        </Text>
                    </div>
                </Flex>

                <Divider className="my-0 mb-5" />

                {/* ── Domestic ── */}
                {shipmentType === 'domestic' && (
                    <Formik
                        initialValues={{
                            originPostCode: shipmentDetails.originPostCode || '',
                            originAddressKey: '',
                            destinationPostCode: shipmentDetails.destinationPostCode || '',
                            destinationAddressKey: '',
                            weight: shipmentDetails.weight || 0,
                            length: shipmentDetails.length || 0,
                            width: shipmentDetails.width || 0,
                            height: shipmentDetails.height || 0,
                            isReturn: false,
                        }}
                        onSubmit={({
                            originPostCode,
                            destinationPostCode,
                            weight,
                            length,
                            width,
                            height,
                            isReturn,
                        }) => {
                            if (isOriginPinInvalid || isDestinationPinInvalid) {
                                dispatch(
                                    showToast({
                                        description: 'Invalid PIN code saved for this address',
                                        variant: 'error',
                                    })
                                );
                                return Promise.resolve([]);
                            }
                            if (isOriginAddressInvalid) {
                                dispatch(
                                    showToast({
                                        description: ORIGIN_ADDRESS_INVALID_MESSAGE,
                                        variant: 'error',
                                    })
                                );
                                return Promise.resolve([]);
                            }
                            return handleCalculateRate({
                                originPostCode,
                                destinationPostCode,
                                weight,
                                length,
                                width,
                                height,
                                isReturn,
                            });
                        }}
                        validationSchema={calculateShipmentSchema}
                    >
                        {({ handleSubmit, setFieldValue, values, errors, touched, resetForm }) => (
                            <Form layout="vertical" className="w-full" onFinish={handleSubmit}>
                                <Row gutter={[0, 16]}>
                                    {/* Shipping Details */}
                                    <Col xs={24} lg={12} className="lg:pr-8">
                                        <Flex align="center" gap={6} className="mb-3">
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 14 14"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M7 11.375C9.41625 11.375 11.375 9.41625 11.375 7C11.375 4.58375 9.41625 2.625 7 2.625C4.58375 2.625 2.625 4.58375 2.625 7C2.625 9.41625 4.58375 11.375 7 11.375Z"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M7 8.75C7.9665 8.75 8.75 7.9665 8.75 7C8.75 6.0335 7.9665 5.25 7 5.25C6.0335 5.25 5.25 6.0335 5.25 7C5.25 7.9665 6.0335 8.75 7 8.75Z"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M7 2.33073V1.16406"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M2.33268 7H1.16602"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M7 11.6641V12.8307"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M11.666 7H12.8327"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <Text className="font-medium text-sm text-gray-600">
                                                Shipping Details
                                            </Text>
                                        </Flex>
                                        <Row gutter={[12, 0]}>
                                            <Col xs={24} sm={12}>
                                                <AddressSelect
                                                    label="Origin"
                                                    options={senderOptions}
                                                    value={values.originAddressKey || undefined}
                                                    onChange={async val => {
                                                        const addr = parseSender(val);
                                                        if (!addr) return;
                                                        setFieldValue('originAddressKey', val);
                                                        setFieldValue(
                                                            'originPostCode',
                                                            addr.zipCode
                                                        );
                                                        const addressInvalid =
                                                            !isPickupAddressValid(addr.address1);
                                                        setIsOriginAddressInvalid(addressInvalid);
                                                        if (addressInvalid) {
                                                            dispatch(
                                                                showToast({
                                                                    description:
                                                                        ORIGIN_ADDRESS_INVALID_MESSAGE,
                                                                    variant: 'error',
                                                                })
                                                            );
                                                        }
                                                        dispatch(
                                                            updateOriginAddress({
                                                                senderName: addr.name,
                                                                senderEmail: addr.email || '',
                                                                senderPhone: addr.phoneNumber,
                                                                senderAddressLine: addr.address1,
                                                                senderAddressLine2:
                                                                    addr.address2 || '',
                                                                senderZipCode: addr.zipCode,
                                                                senderAddressId: addr.id ?? null,
                                                            })
                                                        );
                                                        const lookup = await lookupPostcodeApi({
                                                            userType: role,
                                                            userId: id,
                                                            postcode: addr.zipCode,
                                                        });
                                                        setIsOriginPinInvalid(!lookup);
                                                        if (!lookup) {
                                                            dispatch(
                                                                showToast({
                                                                    description:
                                                                        'Invalid PIN code saved for this address',
                                                                    variant: 'error',
                                                                })
                                                            );
                                                        }
                                                        dispatch(
                                                            updateShipmentDetails({
                                                                originPostCode: addr.zipCode,
                                                                originCity: {
                                                                    city: lookup
                                                                        ? lookup.city
                                                                        : addr.city,
                                                                    state: lookup
                                                                        ? lookup.state
                                                                        : '',
                                                                    countryCode:
                                                                        addr.countryCode || 'IN',
                                                                    countryName:
                                                                        addr.country || 'India',
                                                                },
                                                            })
                                                        );
                                                        hideAndResetWhileChange();
                                                    }}
                                                    onClear={() => {
                                                        setIsOriginPinInvalid(false);
                                                        setIsOriginAddressInvalid(false);
                                                        setFieldValue('originAddressKey', '');
                                                        setFieldValue('originPostCode', '');
                                                        dispatch(
                                                            updateShipmentDetails({
                                                                originPostCode: '',
                                                                originCity: { city: '', state: '' },
                                                            })
                                                        );
                                                        dispatch(
                                                            updateOriginAddress({
                                                                senderName: '',
                                                                senderEmail: '',
                                                                senderPhone: '',
                                                                senderAddressLine: '',
                                                                senderAddressLine2: '',
                                                                senderZipCode: '',
                                                                senderAddressId: null,
                                                            })
                                                        );
                                                        hideAndResetWhileChange();
                                                    }}
                                                    onAddNew={() => openModal(false)}
                                                    onEdit={v => openEditModal(false, v)}
                                                    onDelete={handleDeleteAddress}
                                                    error={errors.originAddressKey}
                                                    touched={!!touched.originAddressKey}
                                                />
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <AddressSelect
                                                    label="Destination"
                                                    options={receiverOptions}
                                                    value={
                                                        values.destinationAddressKey || undefined
                                                    }
                                                    onChange={async val => {
                                                        const addr = parseReceiver(val);
                                                        if (!addr) return;
                                                        setFieldValue('destinationAddressKey', val);
                                                        setFieldValue(
                                                            'destinationPostCode',
                                                            addr.zipCode
                                                        );
                                                        dispatch(
                                                            updateDestinationAddress({
                                                                receiverName: addr.name,
                                                                receiverEmail: addr.email || '',
                                                                receiverPhone: addr.phoneNumber,
                                                                receiverAddressLine: addr.address1,
                                                                receiverAddressLine2:
                                                                    addr.address2 || '',
                                                                receiverZipCode: addr.zipCode,
                                                                receiverPhoneCode:
                                                                    addr.phoneCode || '+91',
                                                                receiverAddressId: addr.id ?? null,
                                                            })
                                                        );
                                                        const lookup = await lookupPostcodeApi({
                                                            userType: role,
                                                            userId: id,
                                                            postcode: addr.zipCode,
                                                        });
                                                        setIsDestinationPinInvalid(!lookup);
                                                        if (!lookup) {
                                                            dispatch(
                                                                showToast({
                                                                    description:
                                                                        'Invalid PIN code saved for this address',
                                                                    variant: 'error',
                                                                })
                                                            );
                                                        }
                                                        dispatch(
                                                            updateShipmentDetails({
                                                                destinationPostCode: addr.zipCode,
                                                                destinationCity: {
                                                                    city: lookup
                                                                        ? lookup.city
                                                                        : addr.city,
                                                                    state: lookup
                                                                        ? lookup.state
                                                                        : '',
                                                                    countryCode:
                                                                        addr.countryCode || 'IN',
                                                                    countryName:
                                                                        addr.country || 'India',
                                                                },
                                                            })
                                                        );
                                                        hideAndResetWhileChange();
                                                    }}
                                                    onClear={() => {
                                                        setIsDestinationPinInvalid(false);
                                                        setFieldValue('destinationAddressKey', '');
                                                        setFieldValue('destinationPostCode', '');
                                                        dispatch(
                                                            updateShipmentDetails({
                                                                destinationPostCode: '',
                                                                destinationCity: {
                                                                    city: '',
                                                                    state: '',
                                                                },
                                                            })
                                                        );
                                                        dispatch(
                                                            updateDestinationAddress({
                                                                receiverName: '',
                                                                receiverEmail: '',
                                                                receiverPhone: '',
                                                                receiverAddressLine: '',
                                                                receiverAddressLine2: '',
                                                                receiverZipCode: '',
                                                                receiverPhoneCode: '+91',
                                                                receiverAddressId: null,
                                                            })
                                                        );
                                                        hideAndResetWhileChange();
                                                    }}
                                                    onAddNew={() => openModal(true)}
                                                    onEdit={v => openEditModal(true, v)}
                                                    onDelete={handleDeleteAddress}
                                                    error={errors.destinationAddressKey}
                                                    touched={!!touched.destinationAddressKey}
                                                />
                                            </Col>
                                        </Row>
                                    </Col>

                                    {/* Item Details */}
                                    <Col xs={24} lg={12} className="lg:pl-8">
                                        <Flex align="center" gap={6} className="mb-3">
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 14 14"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M1.84961 4.33594L7.00043 7.31676L12.1163 4.35342"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M7 12.6033V7.3125"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M5.79285 1.44406L2.67785 3.17658C1.97202 3.56741 1.39453 4.5474 1.39453 5.3524V8.64825C1.39453 9.45325 1.97202 10.4332 2.67785 10.8241L5.79285 12.5566C6.45785 12.9241 7.54868 12.9241 8.21368 12.5566L11.3287 10.8241C12.0345 10.4332 12.612 9.45325 12.612 8.64825V5.3524C12.612 4.5474 12.0345 3.56741 11.3287 3.17658L8.21368 1.44406C7.54285 1.07073 6.45785 1.07073 5.79285 1.44406Z"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M9.91669 7.7223V5.58732L4.38086 2.39062"
                                                    stroke="#62748E"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <Text className="font-medium text-sm text-gray-600">
                                                Package Details
                                            </Text>
                                        </Flex>
                                        <Row gutter={[12, 12]}>
                                            <Col xs={24} sm={6}>
                                                <NumberWithUnit
                                                    name="weight"
                                                    label={
                                                        <span className="text-[11px] text-gray-600 font-medium">
                                                            Weight
                                                            <span className="text-red-500 ml-0.5">
                                                                *
                                                            </span>
                                                        </span>
                                                    }
                                                    unit="Kg"
                                                    min={0}
                                                    size="large"
                                                    step={0.1}
                                                    precision={2}
                                                    placeholder="0.00"
                                                    max={9999.99}
                                                    onChange={hideAndResetWhileChange}
                                                    formItemClass="mb-0 [&_.ant-input-number-group-addon]:bg-transparent [&_.ant-input-number-group-addon]:border-l-0 [&_.ant-input-number-group-addon]:text-xs [&_.ant-input-number-group-addon]:font-semibold [&_.ant-input-number]:w-full"
                                                />
                                            </Col>
                                            <Col xs={24} sm={6}>
                                                <NumberWithUnit
                                                    name="length"
                                                    label={
                                                        <span className="text-[11px] text-gray-600 font-medium">
                                                            Length
                                                            <span className="text-red-500 ml-0.5">
                                                                *
                                                            </span>
                                                        </span>
                                                    }
                                                    unit="CM"
                                                    size="large"
                                                    min={0}
                                                    step={0.1}
                                                    precision={2}
                                                    placeholder="0.00"
                                                    max={9999.99}
                                                    onChange={hideAndResetWhileChange}
                                                    formItemClass="mb-0 [&_.ant-input-number-group-addon]:bg-transparent [&_.ant-input-number-group-addon]:border-l-0 [&_.ant-input-number-group-addon]:text-xs [&_.ant-input-number-group-addon]:font-semibold [&_.ant-input-number]:w-full"
                                                />
                                            </Col>
                                            <Col xs={24} sm={6}>
                                                <NumberWithUnit
                                                    name="width"
                                                    label={
                                                        <span className="text-[11px] text-gray-600 font-medium">
                                                            Width
                                                            <span className="text-red-500 ml-0.5">
                                                                *
                                                            </span>
                                                        </span>
                                                    }
                                                    unit="CM"
                                                    size="large"
                                                    min={0}
                                                    step={0.1}
                                                    precision={2}
                                                    placeholder="0.00"
                                                    max={9999.99}
                                                    onChange={hideAndResetWhileChange}
                                                    formItemClass="mb-0 [&_.ant-input-number-group-addon]:bg-transparent [&_.ant-input-number-group-addon]:border-l-0 [&_.ant-input-number-group-addon]:text-xs [&_.ant-input-number-group-addon]:font-semibold [&_.ant-input-number]:w-full"
                                                />
                                            </Col>
                                            <Col xs={24} sm={6}>
                                                <NumberWithUnit
                                                    name="height"
                                                    label={
                                                        <span className="text-[11px] text-gray-600 font-medium">
                                                            Height
                                                            <span className="text-red-500 ml-0.5">
                                                                *
                                                            </span>
                                                        </span>
                                                    }
                                                    unit="CM"
                                                    size="large"
                                                    min={0}
                                                    step={0.1}
                                                    precision={2}
                                                    placeholder="0.00"
                                                    max={9999.99}
                                                    onChange={hideAndResetWhileChange}
                                                    formItemClass="mb-0 [&_.ant-input-number-group-addon]:bg-transparent [&_.ant-input-number-group-addon]:border-l-0 [&_.ant-input-number-group-addon]:text-xs [&_.ant-input-number-group-addon]:font-semibold [&_.ant-input-number]:w-full"
                                                />
                                            </Col>
                                        </Row>
                                        <Flex align="center" gap={4} className="mt-2">
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 14 14"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <g clipPath="url(#clip0_scale)">
                                                    <path
                                                        d="M12.4254 8.92342C12.5559 9.05348 12.6594 9.20803 12.7301 9.37821C12.8008 9.54838 12.8371 9.73083 12.8371 9.91509C12.8371 10.0993 12.8008 10.2818 12.7301 10.452C12.6594 10.6221 12.5559 10.7767 12.4254 10.9068L10.9087 12.4234C10.7786 12.5539 10.6241 12.6575 10.4539 12.7282C10.2837 12.7988 10.1013 12.8352 9.91704 12.8352C9.73278 12.8352 9.55033 12.7988 9.38016 12.7282C9.20999 12.6575 9.05544 12.5539 8.92537 12.4234L1.57537 5.07342C1.3132 4.80997 1.16602 4.45342 1.16602 4.08175C1.16602 3.71008 1.3132 3.35353 1.57537 3.09009L3.09204 1.57342C3.35549 1.31124 3.71203 1.16406 4.08371 1.16406C4.45538 1.16406 4.81193 1.31124 5.07537 1.57342L12.4254 8.92342Z"
                                                        stroke="#9ca3af"
                                                        strokeWidth="1.16667"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    <path
                                                        d="M8.45898 7.29167L9.62565 6.125"
                                                        stroke="#9ca3af"
                                                        strokeWidth="1.16667"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    <path
                                                        d="M6.70898 5.54167L7.87565 4.375"
                                                        stroke="#9ca3af"
                                                        strokeWidth="1.16667"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    <path
                                                        d="M4.95898 3.79167L6.12565 2.625"
                                                        stroke="#9ca3af"
                                                        strokeWidth="1.16667"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    <path
                                                        d="M10.209 9.04167L11.3757 7.875"
                                                        stroke="#9ca3af"
                                                        strokeWidth="1.16667"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_scale">
                                                        <rect width="14" height="14" fill="white" />
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                            <Text className="text-xs text-gray-400">
                                                Dimensions help us calculate volumetric weight
                                            </Text>
                                        </Flex>
                                    </Col>
                                </Row>

                                <Divider className="my-4" />

                                {/* Footer */}
                                <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                                    <Text className="text-xs text-gray-400">
                                        Estimated price will be shown after calculation
                                    </Text>
                                    <Flex gap={8}>
                                        <Button
                                            onClick={() => {
                                                resetForm();
                                                resetReduxState();
                                                setIsOriginPinInvalid(false);
                                                setIsDestinationPinInvalid(false);
                                                setIsOriginAddressInvalid(false);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                        <Button
                                            danger
                                            type="primary"
                                            htmlType="submit"
                                            loading={isLoading}
                                            icon={<ArrowRightOutlined />}
                                            iconPosition="end"
                                        >
                                            Show Price
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                )}

                {/* ── International (hidden until ready) ── */}
                {false && shipmentType === 'international' && (
                    <Formik
                        initialValues={{
                            originPostCode: '',
                            originAddressKey: '',
                            destinationAddressKey: '',
                            destinationCountryCode: '',
                            weight: 0,
                            length: 0,
                            width: 0,
                            height: 0,
                        }}
                        onSubmit={({
                            originPostCode,
                            destinationCountryCode,
                            weight,
                            length,
                            width,
                            height,
                        }) =>
                            handleCalculateInternationalRate({
                                originPostCode,
                                destinationCountryCode,
                                weight,
                                length,
                                width,
                                height,
                            })
                        }
                        validationSchema={calculateInternationalShipmentSchema}
                    >
                        {({ handleSubmit, setFieldValue, values, errors, touched }) => (
                            <Form layout="vertical" className="w-full" onFinish={handleSubmit}>
                                <Row gutter={[16, 0]} align="top" className="mt-6">
                                    <AddressSelect
                                        label="Origin"
                                        options={senderOptions}
                                        value={values.originAddressKey || undefined}
                                        onChange={async val => {
                                            const addr = parseSender(val);
                                            if (!addr) return;
                                            setFieldValue('originAddressKey', val);
                                            setFieldValue('originPostCode', addr.zipCode);
                                            dispatch(
                                                updateOriginAddress({
                                                    senderName: addr.name,
                                                    senderEmail: addr.email || '',
                                                    senderPhone: addr.phoneNumber,
                                                    senderAddressLine: addr.address1,
                                                    senderAddressLine2: addr.address2 || '',
                                                    senderZipCode: addr.zipCode,
                                                    senderAddressId: addr.id ?? null,
                                                })
                                            );
                                            const lookup = await lookupPostcodeApi({
                                                userType: role,
                                                userId: id,
                                                postcode: addr.zipCode,
                                            });
                                            dispatch(
                                                updateShipmentDetails({
                                                    originPostCode: addr.zipCode,
                                                    originCity: {
                                                        city: lookup ? lookup.city : addr.city,
                                                        state: lookup ? lookup.state : '',
                                                        countryCode: 'IN',
                                                        countryName: 'India',
                                                    },
                                                })
                                            );
                                            hideAndResetWhileChange();
                                        }}
                                        onClear={() => {
                                            setFieldValue('originAddressKey', '');
                                            setFieldValue('originPostCode', '');
                                            dispatch(
                                                updateShipmentDetails({
                                                    originPostCode: '',
                                                    originCity: { city: '', state: '' },
                                                })
                                            );
                                            dispatch(
                                                updateOriginAddress({
                                                    senderName: '',
                                                    senderEmail: '',
                                                    senderPhone: '',
                                                    senderAddressLine: '',
                                                    senderAddressLine2: '',
                                                    senderZipCode: '',
                                                    senderAddressId: null,
                                                })
                                            );
                                            hideAndResetWhileChange();
                                        }}
                                        onAddNew={() => openModal(false)}
                                        error={errors.originAddressKey}
                                        touched={!!touched.originAddressKey}
                                    />

                                    <AddressSelect
                                        label="Destination"
                                        options={receiverOptions}
                                        value={values.destinationAddressKey || undefined}
                                        onChange={async val => {
                                            const addr = parseReceiver(val);
                                            if (!addr) return;
                                            setFieldValue('destinationAddressKey', val);
                                            setFieldValue(
                                                'destinationCountryCode',
                                                addr.countryCode || addr.country || ''
                                            );
                                            dispatch(
                                                updateDestinationAddress({
                                                    receiverName: addr.name,
                                                    receiverEmail: addr.email || '',
                                                    receiverPhone: addr.phoneNumber,
                                                    receiverAddressLine: addr.address1,
                                                    receiverAddressLine2: addr.address2 || '',
                                                    receiverZipCode: addr.zipCode,
                                                    receiverPhoneCode: addr.phoneCode || '+91',
                                                    receiverAddressId: addr.id ?? null,
                                                })
                                            );
                                            const intlLookup =
                                                addr.zipCode && addr.countryCode
                                                    ? await lookupInternationalPostcodeApi({
                                                          userType: role,
                                                          userId: id,
                                                          postcode: addr.zipCode,
                                                          countryCode: addr.countryCode,
                                                      })
                                                    : false;
                                            dispatch(
                                                updateShipmentDetails({
                                                    destinationPostCode: addr.zipCode,
                                                    destinationCity: {
                                                        city: intlLookup
                                                            ? intlLookup.city
                                                            : addr.city,
                                                        state: intlLookup
                                                            ? intlLookup.state
                                                            : addr.state || '',
                                                        countryCode: addr.countryCode,
                                                        countryName: addr.country,
                                                    },
                                                })
                                            );
                                            hideAndResetWhileChange();
                                        }}
                                        onClear={() => {
                                            setFieldValue('destinationAddressKey', '');
                                            setFieldValue('destinationCountryCode', '');
                                            dispatch(
                                                updateShipmentDetails({
                                                    destinationPostCode: '',
                                                    destinationCity: {
                                                        city: '',
                                                        state: '',
                                                        countryCode: '',
                                                        countryName: '',
                                                    },
                                                })
                                            );
                                            dispatch(
                                                updateDestinationAddress({
                                                    receiverName: '',
                                                    receiverEmail: '',
                                                    receiverPhone: '',
                                                    receiverAddressLine: '',
                                                    receiverAddressLine2: '',
                                                    receiverZipCode: '',
                                                    receiverPhoneCode: '+91',
                                                    receiverAddressId: null,
                                                })
                                            );
                                            hideAndResetWhileChange();
                                        }}
                                        onAddNew={() => openModal(true)}
                                        error={errors.destinationAddressKey}
                                        touched={!!touched.destinationAddressKey}
                                    />

                                    <Col xs={24} sm={8} xl={3} className="pb-[28px]">
                                        <NumberWithUnit
                                            name="weight"
                                            label={
                                                <span className="text-xs text-gray-700 font-medium flex items-center">
                                                    Total Weight
                                                    <span className="text-red-500 ml-1">*</span>
                                                </span>
                                            }
                                            unit="Kg"
                                            min={0}
                                            size="large"
                                            step={0.1}
                                            precision={2}
                                            placeholder="0"
                                            max={9999.99}
                                            onChange={hideAndResetWhileChange}
                                            formItemClass="mb-0 [&_.ant-input-number-group-addon]:bg-transparent [&_.ant-input-number-group-addon]:border-l-0 [&_.ant-input-number-group-addon]:text-xs [&_.ant-input-number-group-addon]:font-semibold [&_.ant-input-number]:w-full"
                                        />
                                    </Col>

                                    <Col xs={24} xl={10} className="pb-5">
                                        <Form.Item
                                            label={
                                                <span className="text-xs text-gray-700 font-medium">
                                                    Package Dimensions
                                                </span>
                                            }
                                            className="mb-0"
                                        >
                                            <div className="border border-gray-200 rounded-[10px] px-3 py-5 bg-white shadow-sm">
                                                <Row gutter={8} className="w-full">
                                                    {(['length', 'width', 'height'] as const).map(
                                                        dim => (
                                                            <Col xs={8} key={dim}>
                                                                <NumberWithUnit
                                                                    name={dim}
                                                                    label={
                                                                        <span className="text-xs text-gray-700 font-medium">
                                                                            {dim
                                                                                .charAt(0)
                                                                                .toUpperCase() +
                                                                                dim.slice(1)}
                                                                            <span className="text-red-500 ml-0.5">
                                                                                *
                                                                            </span>
                                                                        </span>
                                                                    }
                                                                    unit="CM"
                                                                    size="large"
                                                                    min={0}
                                                                    step={0.1}
                                                                    precision={2}
                                                                    placeholder="X"
                                                                    max={9999.99}
                                                                    onChange={
                                                                        hideAndResetWhileChange
                                                                    }
                                                                    formItemClass="mb-0 [&_.ant-input-number-group-addon]:bg-transparent [&_.ant-input-number-group-addon]:border-l-0 [&_.ant-input-number-group-addon]:text-xs [&_.ant-input-number-group-addon]:font-semibold [&_.ant-input-number]:w-full"
                                                                />
                                                            </Col>
                                                        )
                                                    )}
                                                </Row>
                                            </div>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} xl={3} style={{ alignSelf: 'center' }}>
                                        <Button
                                            danger
                                            type="primary"
                                            htmlType="submit"
                                            size="large"
                                            block
                                            loading={isLoading}
                                        >
                                            Check Price
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        )}
                    </Formik>
                )}
            </Card>

            <AddAddressModal
                open={modalOpen}
                isReceiver={modalIsReceiver}
                editAddressData={editAddressData}
                onClose={() => setModalOpen(false)}
                onSaved={() => setRefreshKey(k => k + 1)}
            />
        </div>
    );
};

export default CalculateCost;
