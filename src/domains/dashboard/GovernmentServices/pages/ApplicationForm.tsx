import { useEffect, useRef, useState } from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Divider, Flex, Form, Row, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik, useFormikContext } from 'formik';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import MultiTextInput from '@src/components/atomic/inputs/MultiTextInput';
import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextAreaInput from '@src/components/atomic/inputs/TextAreaInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import TimePickerInput from '@src/components/atomic/inputs/TimePickerInput';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getDynamicFieldOptionsApi, getCountriesListApi, getPanBusinessCodesApi } from '../apis';
import AudioUploadField from '../components/AudioUploadField';
import DocumentUploadField from '../components/DocumentUploadField';
import RadioGroupInput from '../components/RadioGroupInput';
import GovSelectInput from '../components/SelectInput';
import { useGovernmentServiceApplication, usePaymentApi } from '../hooks';
import { generateStepSchema } from '../schema';
import { FormField, FormStep } from '../types';
import {
    getApplicationFormStepsByAccessKey,
    getServiceDetailByAccessKey,
    localIdByAccessKey,
    slugToAccessKeyFallback,
} from '../utils';

const { Title, Text } = Typography;

/* eslint-disable react/prop-types */
const DynamicSelectField: React.FC<{ field: FormField }> = ({ field }) => {
    const { values, setFieldValue } = useFormikContext<Record<string, string | string[]>>();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
    const isFirstRender = useRef(true);

    const parentValue = (values[field.dynamicOptions!.dependsOnField] as string) ?? '';

    useEffect(() => {
        if (!parentValue) {
            setOptions([]);
            return;
        }
        const { endpoint, queryParam } = field.dynamicOptions!;
        if (!isFirstRender.current) {
            setFieldValue(field.name, '');
        }
        isFirstRender.current = false;
        const sanitizedParentValue = parentValue.replace(/&/g, 'and');
        getDynamicFieldOptionsApi(
            userId,
            userType,
            endpoint,
            queryParam,
            sanitizedParentValue
        ).then(data => {
            setOptions(data.map(opt => ({ label: opt, value: opt })));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentValue]);

    return (
        <SelectInput
            name={field.name}
            label={field.label}
            placeholder={`Select ${field.label}`}
            isRequired={field.required}
            options={options}
            showSearch
        />
    );
};

const ConditionalSelectOrTextField: React.FC<{ field: FormField }> = ({ field }) => {
    const { values, setFieldValue } = useFormikContext<Record<string, string | string[]>>();
    const { dependsOnField, triggerValue, textPlaceholder } = field.conditionalText!;
    const parentValue = values[dependsOnField] as string;
    const prevParentValue = useRef(parentValue);

    useEffect(() => {
        if (prevParentValue.current !== parentValue) {
            setFieldValue(field.name, '');
            prevParentValue.current = parentValue;
        }
    }, [parentValue]); // eslint-disable-line react-hooks/exhaustive-deps

    if (parentValue === triggerValue) {
        return (
            <SelectInput
                name={field.name}
                label={field.label}
                placeholder={`Select ${field.label}`}
                isRequired={field.required}
                options={(field.options ?? []).map(opt => ({ label: opt, value: opt }))}
                showSearch
            />
        );
    }

    return (
        <TextInput
            name={field.name}
            label={field.label}
            placeholder={textPlaceholder ?? `Enter ${field.label}`}
            isRequired={field.required}
            type="text"
        />
    );
};

const StaticApiSelectField: React.FC<{ field: FormField }> = ({ field }) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchFn =
            field.staticEndpoint === 'pan-business-codes'
                ? getPanBusinessCodesApi(userId, userType)
                : getCountriesListApi(userId, userType);
        fetchFn.then(data => {
            setOptions(data.map(opt => ({ label: opt, value: opt })));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SelectInput
            name={field.name}
            label={field.label}
            placeholder={`Select ${field.label}`}
            isRequired={field.required}
            options={options}
            showSearch
        />
    );
};

const DependentSelectField: React.FC<{ field: FormField }> = ({ field }) => {
    const { values, setFieldValue } = useFormikContext<Record<string, string | string[]>>();
    const { dependsOnField, optionsMap } = field.dependentOptions!;
    const parentValue = (values[dependsOnField] as string) ?? '';
    const prevParentValue = useRef(parentValue);

    useEffect(() => {
        if (prevParentValue.current !== parentValue) {
            setFieldValue(field.name, '');
            prevParentValue.current = parentValue;
        }
    }, [parentValue]); // eslint-disable-line react-hooks/exhaustive-deps

    const options = (optionsMap[parentValue] ?? []).map(opt => ({ label: opt, value: opt }));

    return (
        <SelectInput
            name={field.name}
            label={field.label}
            placeholder={parentValue ? `Select ${field.label}` : `Select Industry / Sector first`}
            isRequired={field.required}
            options={options}
            showSearch
        />
    );
};
const GovMultiSelectField: React.FC<{ field: FormField }> = ({ field }) => (
    <GovSelectInput
        name={field.name}
        label={field.label}
        placeholder={`Select ${field.label}`}
        isRequired={field.required}
        options={(field.options ?? []).map(opt => ({ label: opt, value: opt }))}
        mode="multiple"
        showSearch
        allowClear
    />
);

const StaticApiMultiSelectField: React.FC<{ field: FormField }> = ({ field }) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchFn =
            field.staticEndpoint === 'pan-business-codes'
                ? getPanBusinessCodesApi(userId, userType)
                : getCountriesListApi(userId, userType);
        fetchFn.then(data => {
            setOptions(data.map(opt => ({ label: opt, value: opt })));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <GovSelectInput
            name={field.name}
            label={field.label}
            placeholder={`Select ${field.label}`}
            isRequired={field.required}
            options={options}
            mode="multiple"
            showSearch
            allowClear
        />
    );
};
/* eslint-enable react/prop-types */

const MIME_TO_LABEL: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'video/mp4': 'MP4',
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
};

const getDocumentSubLabel = (allowedTypes?: string[], maxSizeKB?: number): string | undefined => {
    if (!allowedTypes?.length && !maxSizeKB) return undefined;
    const parts: string[] = [];
    if (allowedTypes?.length) {
        const labels = [
            ...new Set(allowedTypes.map(t => MIME_TO_LABEL[t] ?? t.split('/')[1].toUpperCase())),
        ];
        const formatted =
            labels.length > 1
                ? `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
                : labels[0];
        parts.push(`File Formats Supported: ${formatted}`);
    }
    if (maxSizeKB) {
        const sizeStr = maxSizeKB >= 1024 ? `${maxSizeKB / 1024} MB` : `${maxSizeKB} KB`;
        parts.push(`Max. size: ${sizeStr}`);
    }
    return `(${parts.join('. ')})`;
};

const StepIndicator = ({ steps, current }: { steps: FormStep[]; current: number }) => (
    <Flex align="flex-end" wrap="wrap" gap={0}>
        {steps.map((_, i) => {
            const isActive = i === current;
            return (
                <Flex key={i} vertical align="flex-start" gap={6} style={{ marginRight: 20 }}>
                    <Flex align="center" gap={6}>
                        <Flex
                            align="center"
                            justify="center"
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                border: `1.5px solid ${isActive ? '#FF3A3A' : '#D9D9D9'}`,
                                backgroundColor: isActive ? '#FF3A3A' : 'transparent',
                                flexShrink: 0,
                            }}
                        >
                            <CheckOutlined
                                style={{ fontSize: 10, color: isActive ? '#FFFFFF' : '#D9D9D9' }}
                            />
                        </Flex>
                        <Text
                            style={{
                                color: isActive ? '#FF3A3A' : '#8C8C8C',
                                fontSize: 12,
                                fontWeight: isActive ? 500 : 400,
                            }}
                        >
                            Step {i + 1}
                        </Text>
                    </Flex>
                    {isActive && (
                        <div
                            style={{
                                height: 2,
                                width: '100%',
                                backgroundColor: '#FF3A3A',
                                borderRadius: 1,
                            }}
                        />
                    )}
                </Flex>
            );
        })}
    </Flex>
);

const InfoBanner = ({ message }: { message: string }) => (
    <Flex
        className="px-4 py-3 rounded"
        style={{ backgroundColor: '#FFF7F6', border: '1px solid #FFE4E4' }}
    >
        <Text className="text-xs" style={{ color: '#FF3A3A' }}>
            {message}
        </Text>
    </Flex>
);

const getFieldDefault = (f: FormField): string | string[] => {
    if ((f.type === 'select' && f.multiple) || f.type === 'multi-text') return [];
    if (f.name === 'dateOfSubmission') return dayjs().format('YYYY-MM-DD');
    return f.defaultValue ?? '';
};

const ApplicationForm = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as {
        applicationId?: number;
        existingApplicationId?: number;
        eligibilityAnswers?: Record<string, string>;
    } | null;
    const reuploadApplicationId = locationState?.applicationId;
    const existingApplicationId = locationState?.existingApplicationId;
    const eligibilityAnswers = locationState?.eligibilityAnswers ?? {};

    const [currentStep, setCurrentStep] = useState(0);
    const [applicationId, setApplicationId] = useState<number | null>(null);
    const [initialValues, setInitialValues] = useState<Record<string, string | string[]>>({});

    const {
        isLoading: isSubmitting,
        isDraftLoading,
        fetchDraft,
        fetchApplicationById,
        submitApplication,
    } = useGovernmentServiceApplication();
    const selectedService = useAppSelector(
        state => state.reducer.governmentServices.selectedService
    );

    const accessKey =
        selectedService?.accessKey || slugToAccessKeyFallback[selectedService?.slug ?? ''] || '';
    const localServiceId = localIdByAccessKey[accessKey] ?? 0;
    const detail = getServiceDetailByAccessKey(accessKey);
    const steps = getApplicationFormStepsByAccessKey(accessKey);
    const pekoFee = selectedService?.price ?? 0;
    const govFee =
        selectedService?.govtFee === 'Free' ? 0 : ((selectedService?.govtFee as number) ?? 0);
    const total = pekoFee + govFee;

    const {
        handleSubmission,
        loading: isPaymentLoading,
        surchargeData,
        isSurchargeLoading,
        fetchSurcharge,
    } = usePaymentApi();

    useEffect(() => {
        const fieldDefaults = steps
            .flatMap(s => s.fields)
            .reduce<Record<string, string | string[]>>(
                (acc, f) => ({
                    ...acc,
                    [f.name]: getFieldDefault(f),
                }),
                {}
            );

        const readOnlyDefaults = steps
            .flatMap(s => s.fields)
            .filter(f => f.readOnly && f.defaultValue)
            .reduce<Record<string, string>>(
                (acc, f) => ({ ...acc, [f.name]: f.defaultValue! }),
                {}
            );

        const preloadId = reuploadApplicationId ?? existingApplicationId;
        const loader = preloadId ? fetchApplicationById(preloadId) : fetchDraft(accessKey);

        setInitialValues({ ...fieldDefaults, ...readOnlyDefaults });

        loader.then(data => {
            if (data) {
                const flat = Object.values(data.formData).reduce<Record<string, string | string[]>>(
                    (acc, stepData) => ({ ...acc, ...stepData }),
                    {}
                );
                setInitialValues({ ...fieldDefaults, ...readOnlyDefaults, ...flat });
                setApplicationId(data.id);
                if (reuploadApplicationId) {
                    setCurrentStep(0);
                } else {
                    const filledStepCount = Object.entries(data.formData).filter(
                        ([key, stepData]) =>
                            key !== 'eligibility' && stepData && Object.keys(stepData).length > 0
                    ).length;
                    const reviewIndex = steps.findIndex(s => s.stepType === 'review');
                    let targetStep = Math.min(filledStepCount, steps.length - 1);
                    if (reviewIndex !== -1 && targetStep >= reviewIndex) {
                        targetStep = reviewIndex;
                    }
                    setCurrentStep(targetStep);
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId]);

    useEffect(() => {
        const stepType = steps[currentStep]?.stepType;
        if (stepType === 'review' || stepType === 'payment') {
            fetchSurcharge(localServiceId, total);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep]);

    if (!selectedService) {
        navigate(`${paths.dashboard.governmentServices}/explore`);
        return null;
    }

    const activeStep = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const documents = [
        ...(detail?.documents ?? ['Identity Proof', 'Address Proof', 'Business Registration']),
        ...(detail?.optionalDocuments ?? []),
    ];
    const formSteps = steps.filter(s => s.stepType === 'form' && s.fields.length > 0);
    const indicatorSteps = steps.filter(s => s.stepType !== 'payment');

    const handleBack = () => {
        if (currentStep === 0) {
            navigate(
                `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${serviceId}`
            );
        } else {
            setCurrentStep(s => s - 1);
        }
    };

    const handleProceedToPayment = () => {
        handleSubmission({
            serviceId: localServiceId,

            dbServiceId: serviceId ?? '',
            serviceName: selectedService?.name ?? '',
            governmentFee: selectedService?.govtFee ?? 'Free',
            pekoFee,
            applicationId,
        });
    };

    if (isDraftLoading) {
        return <Skeleton active className="px-16 py-6" />;
    }

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={() => {}}
            validationSchema={generateStepSchema(activeStep)}
            enableReinitialize
        >
            {({ values, errors, touched, validateForm, setTouched, setErrors, setFieldValue }) => {
                const renderContent = () => {
                    switch (activeStep.stepType) {
                        case 'form':
                            return (
                                <Flex vertical gap={8}>
                                    {activeStep.infoBanner && (
                                        <InfoBanner message={activeStep.infoBanner} />
                                    )}
                                    <Form layout="vertical">
                                        {activeStep.fields
                                            .filter(field => {
                                                if (!field.dependsOn) return true;
                                                const {
                                                    field: parentField,
                                                    values: triggerValues,
                                                } = field.dependsOn;
                                                const parentVal = values[parentField];
                                                return Array.isArray(parentVal)
                                                    ? parentVal.some(v =>
                                                          triggerValues.includes(v as string)
                                                      )
                                                    : triggerValues.includes(parentVal as string);
                                            })
                                            .map(field => {
                                                if (field.type === 'checkbox') {
                                                    const checkboxError = (
                                                        errors as Record<string, string>
                                                    )[field.name];
                                                    const checkboxTouched = (
                                                        touched as Record<string, boolean>
                                                    )[field.name];
                                                    return (
                                                        <Form.Item
                                                            key={field.name}
                                                            validateStatus={
                                                                checkboxTouched && checkboxError
                                                                    ? 'error'
                                                                    : ''
                                                            }
                                                            help={
                                                                checkboxTouched && checkboxError
                                                                    ? checkboxError
                                                                    : ''
                                                            }
                                                        >
                                                            <Flex vertical gap={4}>
                                                                <Checkbox
                                                                    checked={
                                                                        values[field.name] ===
                                                                        'true'
                                                                    }
                                                                    onChange={e =>
                                                                        setFieldValue(
                                                                            field.name,
                                                                            e.target.checked
                                                                                ? 'true'
                                                                                : ''
                                                                        )
                                                                    }
                                                                >
                                                                    <Text style={{ fontSize: 15 }}>
                                                                        {field.label}
                                                                        {field.required && (
                                                                            <span
                                                                                style={{
                                                                                    color: '#FF3A3A',
                                                                                }}
                                                                            >
                                                                                {' '}
                                                                                *
                                                                            </span>
                                                                        )}
                                                                    </Text>
                                                                </Checkbox>
                                                                {field.helperText && (
                                                                    <Text
                                                                        className="text-xs"
                                                                        style={{
                                                                            color: '#8C8C8C',
                                                                            paddingLeft: 24,
                                                                        }}
                                                                    >
                                                                        {field.helperText}
                                                                    </Text>
                                                                )}
                                                            </Flex>
                                                        </Form.Item>
                                                    );
                                                }
                                                if (field.type === 'multi-text') {
                                                    return (
                                                        <MultiTextInput
                                                            key={field.name}
                                                            name={field.name}
                                                            label={field.label}
                                                            placeholder={
                                                                field.placeholder ??
                                                                `Type and press Enter to add`
                                                            }
                                                            type="text"
                                                            isRequired={field.required}
                                                        />
                                                    );
                                                }
                                                if (field.type === 'select') {
                                                    if (field.multiple && field.staticEndpoint) {
                                                        return (
                                                            <StaticApiMultiSelectField
                                                                key={field.name}
                                                                field={field}
                                                            />
                                                        );
                                                    }
                                                    if (field.multiple) {
                                                        return (
                                                            <GovMultiSelectField
                                                                key={field.name}
                                                                field={field}
                                                            />
                                                        );
                                                    }
                                                    if (field.conditionalText) {
                                                        return (
                                                            <ConditionalSelectOrTextField
                                                                key={field.name}
                                                                field={field}
                                                            />
                                                        );
                                                    }
                                                    if (field.staticEndpoint) {
                                                        return (
                                                            <StaticApiSelectField
                                                                key={field.name}
                                                                field={field}
                                                            />
                                                        );
                                                    }
                                                    if (field.dependentOptions) {
                                                        return (
                                                            <DependentSelectField
                                                                key={field.name}
                                                                field={field}
                                                            />
                                                        );
                                                    }
                                                    if (field.dynamicOptions) {
                                                        return (
                                                            <DynamicSelectField
                                                                key={field.name}
                                                                field={field}
                                                            />
                                                        );
                                                    }
                                                    return (
                                                        <Flex key={field.name} vertical gap={2}>
                                                            <SelectInput
                                                                name={field.name}
                                                                label={field.label}
                                                                placeholder={`Select ${field.label}`}
                                                                isRequired={field.required}
                                                                options={(field.options ?? []).map(
                                                                    opt => ({
                                                                        label: opt,
                                                                        value: opt,
                                                                    })
                                                                )}
                                                                mode={
                                                                    field.multiple
                                                                        ? 'multiple'
                                                                        : undefined
                                                                }
                                                            />
                                                            {field.helperText && (
                                                                <Text
                                                                    className="text-xs"
                                                                    style={{
                                                                        color: '#8C8C8C',
                                                                        marginTop: -16,
                                                                        marginBottom: 8,
                                                                    }}
                                                                >
                                                                    {field.helperText}
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                    );
                                                }
                                                if (field.type === 'radio') {
                                                    return (
                                                        <RadioGroupInput
                                                            key={field.name}
                                                            name={field.name}
                                                            label={field.label}
                                                            isRequired={field.required}
                                                            options={(field.options ?? []).map(
                                                                opt => ({ label: opt, value: opt })
                                                            )}
                                                        />
                                                    );
                                                }
                                                if (field.type === 'textarea') {
                                                    return (
                                                        <TextAreaInput
                                                            key={field.name}
                                                            name={field.name}
                                                            label={field.label}
                                                            placeholder={field.placeholder ?? ''}
                                                            isRequired={field.required}
                                                            minRows={field.rows}
                                                        />
                                                    );
                                                }
                                                if (field.type === 'date') {
                                                    const minDate = field.minToday
                                                        ? dayjs().startOf('day')
                                                        : undefined;
                                                    let maxDate;
                                                    if (field.maxToday) {
                                                        maxDate = dayjs();
                                                    } else if (
                                                        field.maxDaysFromToday !== undefined
                                                    ) {
                                                        maxDate = dayjs()
                                                            .add(field.maxDaysFromToday, 'day')
                                                            .endOf('day');
                                                    }
                                                    return (
                                                        <DatePickerInput
                                                            key={field.name}
                                                            name={field.name}
                                                            label={field.label}
                                                            placeholder={
                                                                field.placeholder ?? 'Select date'
                                                            }
                                                            isRequired={field.required}
                                                            classes="w-full"
                                                            minDate={minDate}
                                                            maxDate={maxDate}
                                                            showTime={field.showTime}
                                                            needConfirm={!!field.showTime}
                                                        />
                                                    );
                                                }
                                                if (field.type === 'time') {
                                                    return (
                                                        <TimePickerInput
                                                            key={field.name}
                                                            name={field.name}
                                                            label={field.label}
                                                            isRequired={field.required}
                                                        />
                                                    );
                                                }
                                                const lowerFieldName = field.name.toLowerCase();
                                                const isNumbersOnly =
                                                    field.allowNumbersOnly ||
                                                    lowerFieldName.includes('mobile') ||
                                                    lowerFieldName.includes('phone') ||
                                                    lowerFieldName.includes('pincode') ||
                                                    (lowerFieldName.includes('aadhaar') &&
                                                        !lowerFieldName.includes('name')) ||
                                                    (lowerFieldName.includes('aadhar') &&
                                                        !lowerFieldName.includes('name')) ||
                                                    lowerFieldName.includes('bankaccount') ||
                                                    lowerFieldName.includes('turnover');
                                                const isAlphabetsAndSpaceOnly =
                                                    field.allowAlphabetsAndSpaceOnly ||
                                                    (!isNumbersOnly &&
                                                        lowerFieldName.includes('name')) ||
                                                    lowerFieldName === 'city' ||
                                                    lowerFieldName === 'district';
                                                const shouldUppercase =
                                                    field.convertToUppercase ||
                                                    ((lowerFieldName.startsWith('pan') ||
                                                        lowerFieldName.endsWith('pan')) &&
                                                        !lowerFieldName.includes('card') &&
                                                        !lowerFieldName.includes('name'));
                                                return (
                                                    <Flex key={field.name} vertical gap={2}>
                                                        <TextInput
                                                            name={field.name}
                                                            label={field.label}
                                                            placeholder={field.placeholder}
                                                            type="text"
                                                            isRequired={field.required}
                                                            allowNumbersOnly={isNumbersOnly}
                                                            allowAlphabetsAndSpaceOnly={
                                                                isAlphabetsAndSpaceOnly
                                                            }
                                                            maxLength={field.maxLength}
                                                            convertToUppercase={shouldUppercase}
                                                            isDisabled={field.readOnly}
                                                        />
                                                        {field.helperText && (
                                                            <Text
                                                                className="text-xs"
                                                                style={{
                                                                    color: '#8C8C8C',
                                                                    marginTop: -16,
                                                                    marginBottom: 8,
                                                                }}
                                                            >
                                                                {field.helperText}
                                                            </Text>
                                                        )}
                                                    </Flex>
                                                );
                                            })}
                                    </Form>
                                </Flex>
                            );

                        case 'upload':
                            return (
                                <Form layout="vertical">
                                    <Flex vertical gap={16}>
                                        <Row gutter={[16, 16]}>
                                            {documents.map((doc, i) => {
                                                const docCondition = detail?.documentConditions?.[doc];
                                                const conditionMet = !docCondition || (() => {
                                                    const parentVal = (values as Record<string, unknown>)[docCondition.field];
                                                    return Array.isArray(parentVal)
                                                        ? (parentVal as string[]).some(v => docCondition.values.includes(v))
                                                        : docCondition.values.includes(parentVal as string);
                                                })();
                                                const isOptional = (detail?.optionalDocuments?.includes(doc) ?? false) || !conditionMet;
                                                const allowedTypes = detail?.documentAllowedFileTypes?.[doc];
                                                const isAudioOnly = (allowedTypes?.length ?? 0) > 0 && allowedTypes!.every(t => t.startsWith('audio/'));
                                                return (
                                                    <Col xs={24} sm={12} key={i}>
                                                        {isAudioOnly ? (
                                                            <AudioUploadField
                                                                name={doc}
                                                                label={doc}
                                                                isRequired={!isOptional}
                                                                subLabel={getDocumentSubLabel(allowedTypes, detail?.documentMaxSizes?.[doc])}
                                                                maxFileSizeKB={detail?.documentMaxSizes?.[doc]}
                                                            />
                                                        ) : (
                                                            <DocumentUploadField
                                                                name={doc}
                                                                label={doc}
                                                                isRequired={!isOptional}
                                                                subLabel={getDocumentSubLabel(allowedTypes, detail?.documentMaxSizes?.[doc])}
                                                                maxFileSize={detail?.documentMaxSizes?.[doc]}
                                                                allowedFileTypes={allowedTypes}
                                                            />
                                                        )}
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </Flex>
                                </Form>
                            );

                        case 'review':
                            return (
                                <Flex
                                    vertical
                                    gap={20}
                                    style={{ overflow: 'hidden', width: '100%' }}
                                >
                                    <Text strong className="text-sm">
                                        Review Your Application
                                    </Text>
                                    {formSteps.map(step => {
                                        const globalIdx = steps.indexOf(step);
                                        return (
                                            <Flex
                                                vertical
                                                gap={10}
                                                key={step.title}
                                                style={{ overflow: 'hidden', minWidth: 0 }}
                                            >
                                                <Flex justify="space-between" align="center">
                                                    <Text strong className="text-xs">
                                                        {step.title}
                                                    </Text>
                                                    <Text
                                                        className="text-xs cursor-pointer"
                                                        style={{ color: '#FF3A3A' }}
                                                        onClick={() => setCurrentStep(globalIdx)}
                                                    >
                                                        Edit
                                                    </Text>
                                                </Flex>
                                                {step.fields
                                                    .filter(field => {
                                                        if (!field.dependsOn) return true;
                                                        const {
                                                            field: parentField,
                                                            values: triggerValues,
                                                        } = field.dependsOn;
                                                        const parentVal = (
                                                            values as Record<string, unknown>
                                                        )[parentField];
                                                        return Array.isArray(parentVal)
                                                            ? parentVal.some(v =>
                                                                  triggerValues.includes(
                                                                      v as string
                                                                  )
                                                              )
                                                            : triggerValues.includes(
                                                                  parentVal as string
                                                              );
                                                    })
                                                    .map(field => (
                                                        <Flex
                                                            justify="space-between"
                                                            gap={12}
                                                            key={field.name}
                                                            style={{ overflow: 'hidden' }}
                                                        >
                                                            <Text
                                                                className="text-xs"
                                                                style={{
                                                                    color: '#8C8C8C',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                {field.label}:
                                                            </Text>
                                                            <div
                                                                style={{
                                                                    flex: '1 1 0px',
                                                                    minWidth: 0,
                                                                    maxWidth: '60%',
                                                                    overflow: 'hidden',
                                                                    textAlign: 'right',
                                                                }}
                                                            >
                                                                <Text
                                                                    className="text-xs font-medium"
                                                                    style={{
                                                                        wordBreak: 'break-all',
                                                                        overflowWrap: 'anywhere',
                                                                        display: 'block',
                                                                    }}
                                                                >
                                                                    {(() => {
                                                                        const val = (
                                                                            values as Record<
                                                                                string,
                                                                                string
                                                                            >
                                                                        )[field.name];
                                                                        if (
                                                                            field.type ===
                                                                            'checkbox'
                                                                        )
                                                                            return val === 'true'
                                                                                ? 'Yes'
                                                                                : 'Not provided';
                                                                        return (
                                                                            val || 'Not provided'
                                                                        );
                                                                    })()}
                                                                </Text>
                                                            </div>
                                                        </Flex>
                                                    ))}
                                                <Divider className="!my-1" />
                                            </Flex>
                                        );
                                    })}
                                    <Flex vertical gap={10}>
                                        <Flex justify="space-between" align="center">
                                            <Text strong className="text-xs">
                                                Documents
                                            </Text>
                                            <Text
                                                className="text-xs cursor-pointer"
                                                style={{ color: '#FF3A3A' }}
                                                onClick={() =>
                                                    setCurrentStep(
                                                        steps.findIndex(
                                                            s => s.stepType === 'upload'
                                                        )
                                                    )
                                                }
                                            >
                                                Edit
                                            </Text>
                                        </Flex>
                                        <Flex vertical gap={6}>
                                            {documents.map((doc, i) => (
                                                <Flex align="center" gap={6} key={i}>
                                                    <span
                                                        style={{ color: '#FF3A3A', fontSize: 16 }}
                                                    >
                                                        •
                                                    </span>
                                                    <Text className="text-xs">{doc}</Text>
                                                </Flex>
                                            ))}
                                        </Flex>
                                    </Flex>
                                </Flex>
                            );

                        case 'payment':
                            return (
                                <Flex vertical gap={12}>
                                    <Text strong className="text-sm">
                                        Payment Summary
                                    </Text>
                                    {detail?.governmentFee !== 'Free' &&
                                        detail?.governmentFee !== 0 && (
                                            <Flex justify="space-between">
                                                <Text
                                                    className="text-xs"
                                                    style={{ color: '#8C8C8C' }}
                                                >
                                                    Government Fee
                                                </Text>
                                                <Text
                                                    className="text-xs"
                                                    style={{ color: '#8C8C8C' }}
                                                >
                                                    ₹{' '}
                                                    {(
                                                        detail?.governmentFee as number
                                                    )?.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </Text>
                                            </Flex>
                                        )}
                                    <Flex justify="space-between">
                                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                                            Peko Service Fee
                                        </Text>
                                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                                            ₹{' '}
                                            {pekoFee.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </Text>
                                    </Flex>
                                    {isSurchargeLoading ? (
                                        <Skeleton active paragraph={{ rows: 1 }} title={false} />
                                    ) : (
                                        surchargeData && (
                                            <>
                                                {Number(surchargeData.surcharge) > 0 && (
                                                    <Flex justify="space-between">
                                                        <Text
                                                            className="text-xs"
                                                            style={{ color: '#8C8C8C' }}
                                                        >
                                                            Surcharge
                                                        </Text>
                                                        <Text
                                                            className="text-xs"
                                                            style={{ color: '#8C8C8C' }}
                                                        >
                                                            ₹{' '}
                                                            {Number(
                                                                surchargeData.surcharge
                                                            ).toLocaleString('en-IN', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </Text>
                                                    </Flex>
                                                )}
                                                {Number(surchargeData.corporateCashback) > 0 && (
                                                    <Flex justify="space-between">
                                                        <Text
                                                            className="text-xs"
                                                            style={{ color: '#8C8C8C' }}
                                                        >
                                                            Corporate Cashback
                                                        </Text>
                                                        <Text
                                                            className="text-xs"
                                                            style={{ color: '#52C41A' }}
                                                        >
                                                            - ₹{' '}
                                                            {Number(
                                                                surchargeData.corporateCashback
                                                            ).toLocaleString('en-IN', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </Text>
                                                    </Flex>
                                                )}
                                            </>
                                        )
                                    )}
                                    <Flex justify="space-between">
                                        <Text className="text-xs font-medium">Total</Text>
                                        <Text
                                            className="text-xs font-medium"
                                            style={{ color: '#FF3A3A' }}
                                        >
                                            ₹{' '}
                                            {(
                                                total +
                                                Number(surchargeData?.surcharge ?? 0) -
                                                Number(surchargeData?.corporateCashback ?? 0)
                                            ).toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </Text>
                                    </Flex>
                                    <Divider className="!my-1" />
                                    <InfoBanner message="Your payment is secured with 256-bit encryption" />
                                </Flex>
                            );

                        default:
                            return null;
                    }
                };

                return (
                    <Flex vertical gap={20} className="px-40 py-6">
                        <Flex vertical gap={4}>
                            <Title level={4} className="!mb-0">
                                {selectedService?.name} - Application
                            </Title>
                            <Text style={{ color: '#8C8C8C' }} className="text-sm">
                                Step {Math.min(currentStep + 1, indicatorSteps.length)} of{' '}
                                {indicatorSteps.length}: {activeStep.title}
                            </Text>
                        </Flex>

                        <StepIndicator steps={indicatorSteps} current={currentStep} />

                        <Flex
                            vertical
                            gap={20}
                            className="p-6"
                            style={{
                                border: '1px solid #F0F0F0',
                                backgroundColor: '#FFFFFF',
                                borderRadius: 20,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            }}
                        >
                            {renderContent()}
                        </Flex>

                        <Flex justify="flex-end" gap={12}>
                            <Button onClick={handleBack}>Back</Button>
                            <Button
                                type="primary"
                                danger
                                loading={isSubmitting || isPaymentLoading}
                                onClick={
                                    isLastStep
                                        ? handleProceedToPayment
                                        : async () => {
                                              if (activeStep.stepType === 'review') {
                                                  if (reuploadApplicationId) {
                                                      if (accessKey) {
                                                          const result = await submitApplication(
                                                              accessKey,
                                                              {},
                                                              reuploadApplicationId,
                                                              'SUBMITTED'
                                                          );
                                                          if (result) {
                                                              navigate(
                                                                  paths.dashboard.governmentServices
                                                              );
                                                          }
                                                      }
                                                      return;
                                                  }
                                                  handleSubmission({
                                                      serviceId: localServiceId,

                                                      dbServiceId: serviceId ?? '',
                                                      serviceName: selectedService?.name ?? '',
                                                      governmentFee:
                                                          selectedService?.govtFee ?? 'Free',
                                                      pekoFee,
                                                      applicationId,
                                                  });
                                                  return;
                                              }

                                              if (activeStep.stepType === 'form') {
                                                  const validationErrors = await validateForm();
                                                  if (Object.keys(validationErrors).length > 0) {
                                                      const touchedFields =
                                                          activeStep.fields.reduce<
                                                              Record<string, boolean>
                                                          >(
                                                              (acc, f) => ({
                                                                  ...acc,
                                                                  [f.name]: true,
                                                              }),
                                                              {}
                                                          );
                                                      setTouched(touchedFields, false);
                                                      setErrors(validationErrors);
                                                      return;
                                                  }
                                              }

                                              if (activeStep.stepType === 'upload') {
                                                  const allValues = values as Record<
                                                      string,
                                                      unknown
                                                  >;
                                                  const requiredDocs = documents.filter(doc => {
                                                      if (detail?.optionalDocuments?.includes(doc))
                                                          return false;
                                                      const condition =
                                                          detail?.documentConditions?.[doc];
                                                      if (!condition) return true;
                                                      const conditionVal =
                                                          allValues[condition.field];
                                                      return Array.isArray(conditionVal)
                                                          ? condition.values.some(v =>
                                                                (conditionVal as string[]).includes(
                                                                    v
                                                                )
                                                            )
                                                          : condition.values.includes(
                                                                conditionVal as string
                                                            );
                                                  });
                                                  const missingDocs = requiredDocs.filter(
                                                      doc => !allValues[doc]
                                                  );
                                                  if (missingDocs.length > 0) {
                                                      const touchedFields = documents.reduce<
                                                          Record<string, boolean>
                                                      >(
                                                          (acc, doc) => ({ ...acc, [doc]: true }),
                                                          {}
                                                      );
                                                      const uploadErrors = missingDocs.reduce<
                                                          Record<string, string>
                                                      >(
                                                          (acc, doc) => ({
                                                              ...acc,
                                                              [doc]: `Please upload ${doc}`,
                                                          }),
                                                          {}
                                                      );
                                                      setTouched(touchedFields, false);
                                                      setErrors(uploadErrors);
                                                      return;
                                                  }
                                              }

                                              if (accessKey) {
                                                  const allValues = values as Record<
                                                      string,
                                                      unknown
                                                  >;
                                                  const stepValues =
                                                      activeStep.stepType === 'upload'
                                                          ? documents.reduce<
                                                                Record<string, unknown>
                                                            >((acc, doc) => {
                                                                if (allValues[doc] !== undefined)
                                                                    acc[doc] = allValues[doc];
                                                                return acc;
                                                            }, {})
                                                          : activeStep.fields
                                                                .filter(field => {
                                                                    if (!field.dependsOn)
                                                                        return true;
                                                                    const {
                                                                        field: parentField,
                                                                        values: triggerValues,
                                                                    } = field.dependsOn;
                                                                    const parentVal =
                                                                        allValues[parentField];
                                                                    return Array.isArray(parentVal)
                                                                        ? (
                                                                              parentVal as string[]
                                                                          ).some(v =>
                                                                              triggerValues.includes(
                                                                                  v
                                                                              )
                                                                          )
                                                                        : triggerValues.includes(
                                                                              parentVal as string
                                                                          );
                                                                })
                                                                .reduce<Record<string, unknown>>(
                                                                    (acc, f) => {
                                                                        if (
                                                                            allValues[f.name] !==
                                                                            undefined
                                                                        )
                                                                            acc[f.name] =
                                                                                allValues[f.name];
                                                                        return acc;
                                                                    },
                                                                    {}
                                                                );
                                                  const formDataPayload: Record<string, unknown> = {
                                                      [`step${currentStep + 1}`]: stepValues,
                                                  };
                                                  if (
                                                      currentStep === 0 &&
                                                      Object.keys(eligibilityAnswers).length > 0
                                                  ) {
                                                      formDataPayload.eligibility =
                                                          eligibilityAnswers;
                                                  }
                                                  const result = await submitApplication(
                                                      accessKey,
                                                      formDataPayload,
                                                      reuploadApplicationId ?? existingApplicationId
                                                  );
                                                  if (result) {
                                                      if (
                                                          typeof result === 'object' &&
                                                          result.applicationId
                                                      ) {
                                                          setApplicationId(
                                                              Number(result.applicationId)
                                                          );
                                                      }
                                                      setCurrentStep(s => s + 1);
                                                  }
                                              } else {
                                                  setCurrentStep(s => s + 1);
                                              }
                                          }
                                }
                            >
                                {(() => {
                                    if (activeStep.stepType === 'review')
                                        return reuploadApplicationId ? 'Submit' : 'Proceed to Pay';
                                    if (isLastStep) return 'Proceed to Pay';
                                    return 'Next →';
                                })()}
                            </Button>
                        </Flex>
                    </Flex>
                );
            }}
        </Formik>
    );
};

export default ApplicationForm;
