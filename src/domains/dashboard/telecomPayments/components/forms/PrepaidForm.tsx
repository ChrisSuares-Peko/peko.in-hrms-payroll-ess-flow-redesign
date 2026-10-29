import React, { useEffect, useRef, useState } from 'react';

import { Button, Col, Form, Row } from 'antd';
import { Formik } from 'formik';
import { createPortal } from 'react-dom';
import Lottie from 'react-lottie';
import { useLocation } from 'react-router-dom';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import SearchSelectInput from '@src/domains/dashboard/billPayments/components/CustomSelectSearch';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getPrepaidPlans } from '../../api/index';
import animationData from '../../assets/animation/mobilerecharge.json';
import useGeneralApi from '../../hooks/useGeneralApi';
import useGetNumberDetails from '../../hooks/useGetNumberDetails';
import useMobileRechargeProviders from '../../hooks/useMobileRechargeProviders';
import { prepaidFormSchema } from '../../schema';
import { clearPrepaidBeneficiary } from '../../slice/beneficiarySlice';
import { Beneficiary, MobilePlan, PrepaidFormData } from '../../types';

type PrepaidFormProps = {
    onProceed: (
        formData: PrepaidFormData,
        plansData: MobilePlan[],
        planCategories: string[]
    ) => Promise<void> | void;
    initialFormData?: PrepaidFormData | null;
};

const PrepaidForm: React.FC<PrepaidFormProps> = ({ onProceed, initialFormData }) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { prepaidBeneficiary } = useAppSelector(state => state.reducer.benficiaryPrepaid);
    const { prepaid } = useAppSelector(state => state.reducer.Prepaid);
    const { stateData } = useGeneralApi();
    const { prepaidProviders } = useMobileRechargeProviders();
    const { state } = useLocation();
    const dispatch = useAppDispatch();
    const hasEdited = useRef(false);
    const [isServiceProviderOpen, setIsServiceProviderOpen] = useState(false);
    const [isCircleOpen, setIsCircleOpen] = useState(false);

    const beneficiaryData: Beneficiary = state || prepaidBeneficiary || null;

    const [prefilledValues, setPrefilledValues] = useState({
        serviceProvider: initialFormData?.serviceProvider || beneficiaryData?.serviceProvider || '',
        circle: initialFormData?.circle || beneficiaryData?.providerCircle || '',
        mobileNumber: initialFormData?.mobileNumber || beneficiaryData?.phoneNo || '',
    });

    const [beneficiarySelectionCounter, setBeneficiarySelectionCounter] = useState<number>(0);
    const previousBeneficiaryRef = useRef<string>('');

    useEffect(() => {
        let currentBeneficiary = null;
        let isFromRedux = false;

        if (
            prepaidBeneficiary?.serviceProvider ||
            prepaidBeneficiary?.providerCircle ||
            prepaidBeneficiary?.phoneNo
        ) {
            currentBeneficiary = prepaidBeneficiary;
            isFromRedux = true;
        } else if (
            state &&
            (state.serviceProvider ||
                state.providerCircle ||
                state.circle ||
                state.phoneNo ||
                state.mobileNumber)
        ) {
            currentBeneficiary = state;
        }

        if (!currentBeneficiary) return;

        const beneficiaryId = (currentBeneficiary as any).id || '';
        const serviceProvider = currentBeneficiary.serviceProvider || '';
        const circle =
            currentBeneficiary.providerCircle || (currentBeneficiary as any).circle || '';
        const phoneNo =
            currentBeneficiary.phoneNo || (currentBeneficiary as any).mobileNumber || '';
        const beneficiaryKey = beneficiaryId
            ? `${beneficiaryId}-${serviceProvider}-${circle}-${phoneNo}`
            : `${serviceProvider}-${circle}-${phoneNo}`;

        setPrefilledValues({ serviceProvider, circle, mobileNumber: phoneNo });

        const hasChanged = previousBeneficiaryRef.current !== beneficiaryKey;
        if (hasChanged || isFromRedux) {
            setBeneficiarySelectionCounter(prev => prev + 1);
            previousBeneficiaryRef.current = beneficiaryKey;
        }
    }, [prepaidBeneficiary, state]);

    const [mobileNumber, setMobileNumber] = useState(
        initialFormData?.mobileNumber || beneficiaryData?.phoneNo || ''
    );
    const { getNumberData, numberData, isLoading } = useGetNumberDetails(mobileNumber);

    useEffect(() => {
        const newMobileNumber = prefilledValues.mobileNumber || '';
        if (newMobileNumber && newMobileNumber !== mobileNumber) {
            setMobileNumber(newMobileNumber);
            hasEdited.current = false;
        }
    }, [prefilledValues.mobileNumber, mobileNumber]);

    useEffect(() => {
        if (hasEdited.current && mobileNumber?.length === 10) {
            getNumberData();
        }
    }, [getNumberData, mobileNumber]);

    useEffect(() => {
        if (numberData?.CurrentOperator && numberData?.CurrentLocation) {
            const matchedProvider = prepaidProviders.find(
                opt => opt.label.toLowerCase() === numberData.CurrentOperator.toLowerCase()
            );
            const matchedCircle = stateData?.find(
                opt => opt.label.toLowerCase() === numberData.CurrentLocation.toLowerCase()
            );
            setPrefilledValues({
                serviceProvider: matchedProvider?.value || numberData.CurrentOperator,
                circle: matchedCircle?.value || numberData.CurrentLocation,
                mobileNumber: numberData.MobileNo,
            });
        }
    }, [numberData, stateData, prepaidProviders]);

    useEffect(
        () => () => {
            dispatch(clearPrepaidBeneficiary());
        },
        [dispatch]
    );

    return (
        <Formik
            key={`prepaid-form-${beneficiarySelectionCounter}-${prefilledValues.mobileNumber || ''}-${prefilledValues.serviceProvider || ''}`}
            initialValues={{
                serviceProvider: prefilledValues.serviceProvider || prepaid.serviceProvider || '',
                circle: prefilledValues.circle || prepaid.circle || '',
                mobileNumber: prefilledValues.mobileNumber || prepaid.mobileNumber || '',
                saveToBeneficiaries: false,
                beneficiaryName: '',
            }}
            onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                try {
                    const data = await getPrepaidPlans({
                        userType: role,
                        userId: id,
                        serviceProvider: values.serviceProvider,
                        location: values.circle,
                        mobileNumber: values.mobileNumber,
                    });
                    if (data !== false) {
                        const providerLabel =
                            prepaidProviders.find(p => p.value === values.serviceProvider)?.label ||
                            values.serviceProvider;
                        const circleLabel =
                            stateData?.find(s => s.value === values.circle)?.label || values.circle;
                        await onProceed(
                            { ...values, providerLabel, circleLabel },
                            data.plans,
                            data.planCategory
                        );
                    }
                    if (typeof Moengage?.track_event === 'function') {
                        Moengage.track_event('prepaid_details_submitted', {
                            service_provider: values.serviceProvider,
                            circle: values.circle,
                            number: values.mobileNumber,
                        });
                    }
                } finally {
                    setSubmitting(false);
                }
            }}
            validationSchema={prepaidFormSchema}
            enableReinitialize
        >
            {({ handleSubmit, values, isSubmitting, setFieldValue, validateField }) => (
                <>
                    {(isSubmitting || isLoading) &&
                        createPortal(
                            <div
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 9999,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.55)',
                                }}
                            >
                                <Lottie
                                    options={{
                                        loop: true,
                                        autoplay: true,
                                        animationData,
                                        rendererSettings: {
                                            preserveAspectRatio: 'xMidYMid slice',
                                        },
                                    }}
                                    height={150}
                                    width={150}
                                />
                            </div>,
                            document.body
                        )}
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <Row gutter={[30, 0]} className="flex-col sm:flex-row">
                            <Col xs={24} sm={12}>
                                <TextInput
                                    label="Mobile Number"
                                    name="mobileNumber"
                                    placeholder="Enter Mobile number"
                                    isRequired
                                    type="text"
                                    allowNumbersOnly
                                    maxLength={10}
                                    handleChange={value => {
                                        setFieldValue('mobileNumber', value);
                                        setMobileNumber(value);
                                        hasEdited.current = true;
                                        if (!value) {
                                            setFieldValue('serviceProvider', '');
                                            setFieldValue('circle', '');
                                        }
                                    }}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <SelectInput
                                    isRequired
                                    name="serviceProvider"
                                    label="Service Provider"
                                    placeholder="Select service provider"
                                    options={prepaidProviders}
                                    allowClear
                                    handleChange={value => {
                                        const serviceprovider = value !== undefined ? value : '';
                                        setTimeout(() => validateField('serviceProvider'), 0);
                                        setFieldValue('serviceProvider', serviceprovider);
                                        setIsServiceProviderOpen(false);
                                        if (!value) {
                                            setFieldValue('circle', '');
                                            setIsCircleOpen(false);
                                            return;
                                        }
                                        if (values.circle) return;
                                        if (value) setTimeout(() => setIsCircleOpen(true), 100);
                                    }}
                                    open={isServiceProviderOpen}
                                    onDropdownVisibleChange={open => setIsServiceProviderOpen(open)}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <SearchSelectInput
                                    isRequired
                                    name="circle"
                                    label="Select Circle"
                                    allowClear
                                    options={stateData || []}
                                    placeholder="Search Circle"
                                    handleChange={value => {
                                        const circ = value !== undefined ? value : '';
                                        setFieldValue('circle', circ);
                                    }}
                                    open={isCircleOpen}
                                    onDropdownVisibleChange={open => setIsCircleOpen(open)}
                                />
                            </Col>
                        </Row>
                        <div className="mt-3">
                            <CheckboxInput
                                name="saveToBeneficiaries"
                                onChange={e => {
                                    if (!e.target.checked) {
                                        setFieldValue('beneficiaryName', '');
                                    }
                                }}
                            >
                                Save this number to Your Beneficiaries
                            </CheckboxInput>
                            {values.saveToBeneficiaries && (
                                <div className="mt-2">
                                    <TextInput
                                        name="beneficiaryName"
                                        label="Beneficiary Name"
                                        placeholder="Enter a name (e.g. Mom, Office)"
                                        isRequired
                                        type="text"
                                        maxLength={50}
                                    />
                                </div>
                            )}
                        </div>
                        <Button
                            htmlType="submit"
                            type="primary"
                            danger
                            className="px-10 mt-4 !rounded-lg text-sm"
                        >
                            Proceed
                        </Button>
                    </Form>
                </>
            )}
        </Formik>
    );
};

export default PrepaidForm;
