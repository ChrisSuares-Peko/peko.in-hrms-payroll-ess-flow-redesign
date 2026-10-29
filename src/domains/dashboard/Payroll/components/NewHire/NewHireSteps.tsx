import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { CloudUploadOutlined, PlusCircleOutlined, UserOutlined } from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Button,
    Col,
    Flex,
    Form,
    InputNumber,
    Radio,
    Row,
    Skeleton,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import TypographyText from '@components/atomic/typography/typographyText';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { showToast } from '@src/slices/apiSlice';

import OfferLetterSignerCard, { SignerValues } from './OfferLetterSignerCard';
import PDFViewer, { SignatureField } from './PDFViewer';
import { createEmployeeDeductionComponent } from '../../api/employeeProfileApi/index';
import {
    createEmployeeSalaryComponent,
    getAllSalaryComponent,
    getCurrentSalaryComponent,
} from '../../api/organizationSettings/index';
import useEpfApplicabilityApi from '../../hooks/complianceSettings/useEpfApplicabilityApi';
import { useGetComplianceSettingsApi } from '../../hooks/complianceSettings/useGetComplianceSettingsApi';
import { useCtcCalculatorState } from '../../hooks/ctcCalculator/useCtcCalculatorState';
import useGeneralApi from '../../hooks/employeeHooks/useGetCountry';
import { useGetDepartmentList } from '../../hooks/employeeHooks/useGetDepartment';
import { useGetAllDeductions } from '../../hooks/OrganizationSettings/useGetDeductionComponentApi';
import {
    resolveEpfApplicableForJoiners,
    resolveEpfPolicyFromComplianceSettings,
    resolveShowPfInEarningsFromComplianceSettings,
    willEpfBecomeMandatory,
} from '../../utils/ctcCalculator/calculateEmployerPf';
import {
    mapDeductionComponentsToDeductions,
    mapSalaryComponentsToEarnings,
} from '../../utils/ctcCalculator/mapOrgComponentsToCtcModel';
import { isPfEarningsLine } from '../../utils/ctcCalculator/pfEarningsLine';
import { CtcDeductionComponent, CtcEarningComponent } from '../../utils/ctcCalculator/types';
import CtcBreakdownCard from '../ctcCalculator/CtcBreakdownCard';
import CtcDeductionDrawer from '../ctcCalculator/CtcDeductionDrawer';
import CtcEarningDrawer from '../ctcCalculator/CtcEarningDrawer';
import DepartmentModal from '../modals/DepartmentModal';

export const NEW_HIRE_STEPS = ['Basic Details', 'Salary', 'Offer Letter'];

const MAX_OFFER_LETTER_SIZE = 5 * 1024 * 1024;

const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
];

export const newHireInitialValues = {
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    country: undefined,
    mobileNo: '',
    email: '',
    department: undefined,
    designation: '',
    dateOfJoin: '',
    profileImage: '',
    profileImageFormat: '',
};

// Shown above the step tabs on the Add New Hire page, visible on every step.
export const ProfilePictureUpload = () => {
    const { values } = useFormikContext<typeof newHireInitialValues>();

    return (
        <Form layout="vertical" className="[&_.ant-form-item]:!mb-0">
            <Flex align="center" vertical gap={8}>
                <Avatar
                    size={100}
                    icon={<UserOutlined />}
                    src={
                        values.profileImage
                            ? `data:image/${values.profileImageFormat};base64,${values.profileImage}`
                            : undefined
                    }
                />
                <FileUploadInput
                    name="profileImage"
                    format="profileImageFormat"
                    label=""
                    maxFileSize={10 * 1024}
                />
                <Typography.Text
                    type="secondary"
                    className="text-xs"
                    style={{ whiteSpace: 'nowrap' }}
                >
                    (File Formats Supported: JPG, JPEG, PNG. Max. size: 10 MB)
                </Typography.Text>
                <Typography.Text className="text-base font-normal">
                    Add Profile Picture
                </Typography.Text>
            </Flex>
        </Form>
    );
};

export const BasicDetailsStep = () => {
    const { countriesList } = useGeneralApi();
    const { tableData: departmentOptions, refetch: refetchDepartments } = useGetDepartmentList();
    const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);

    return (
        <>
            <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <TextInput
                            name="firstName"
                            type="text"
                            label="First Name"
                            placeholder="Enter first name"
                            isRequired
                            maxLength={50}
                            allowAlphabetsAndSpaceOnly
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput
                            name="lastName"
                            type="text"
                            label="Last Name"
                            placeholder="Enter last name"
                            isRequired
                            maxLength={50}
                            allowAlphabetsAndSpaceOnly
                        />
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <SelectInput
                            name="gender"
                            label="Gender"
                            placeholder="Select gender"
                            options={genderOptions}
                            isRequired
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <DatePickerInput
                            name="dateOfBirth"
                            label="Date of Birth"
                            placeholder="Select date of birth"
                            classes="w-full"
                            needConfirm={false}
                            maxDate={dayjs().subtract(18, 'year')}
                            isRequired
                        />
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <SelectInputWithSearch
                            name="country"
                            label="Country"
                            placeholder="Select country"
                            options={countriesList ?? []}
                            isRequired
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput
                            name="mobileNo"
                            type="text"
                            label="Mobile Number"
                            placeholder="Enter mobile number"
                            isRequired
                            allowNumbersOnly
                            maxLength={10}
                        />
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <TextInput
                            name="email"
                            type="text"
                            label="Personal Email"
                            placeholder="Enter personal email"
                            isRequired
                            maxLength={100}
                            allowEmailsOnly
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <SelectInputWithSearch
                            name="department"
                            label="Department"
                            placeholder="Select department"
                            options={departmentOptions}
                            notFoundContent={
                                <Flex vertical align="center" gap={8} className="py-2">
                                    <Typography.Text type="secondary">
                                        No departments yet
                                    </Typography.Text>
                                    <Button
                                        type="link"
                                        danger
                                        icon={<PlusCircleOutlined />}
                                        onClick={() => setOpenAddDepartmentModal(true)}
                                    >
                                        Add Department
                                    </Button>
                                </Flex>
                            }
                        />
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <TextInput
                            name="designation"
                            type="text"
                            label="Designation"
                            placeholder="Enter designation"
                            isRequired
                            maxLength={50}
                            allowAlphabetsAndSpaceOnly
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <DatePickerInput
                            name="dateOfJoin"
                            label="Date of Joining"
                            placeholder="Select date"
                            classes="w-full"
                            needConfirm={false}
                            isRequired
                        />
                    </Col>
                </Row>
            </Form>
            {openAddDepartmentModal && (
                <DepartmentModal
                    open={openAddDepartmentModal}
                    handleCancel={() => {
                        setOpenAddDepartmentModal(false);
                        refetchDepartments();
                    }}
                />
            )}
        </>
    );
};

export interface SalaryField {
    id: string;
    componentName: string;
    calculationType: string;
    isGlobal: boolean;
    calculatedAmount: number;
}

// Fetches the corporate's configured salary components for this (not-yet-created)
// employee's email, mirroring SalaryInfo.tsx's own data source, so the New Hire
// form shows the same components/defaults the regular Add Employee flow would.
export const useNewHireSalaryFields = (email: string) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const debouncedEmail = useDebounce(email, 500);
    const [salaryFields, setSalaryFields] = useState<SalaryField[]>([]);
    const [originalFields, setOriginalFields] = useState<SalaryField[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!debouncedEmail) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const data = await getAllSalaryComponent({ userId, userType, eId: debouncedEmail });
        if (data) {
            const fields = (data.componentData || []).map(component => ({
                // This endpoint returns raw Mongoose documents (`_id`), not the
                // toJSON-transformed shape (`id`) most other endpoints use.
                id: component._id,
                componentName: component.componentName,
                calculationType: component.calculationType,
                isGlobal: component.isGlobal,
                calculatedAmount: Number(component.calculatedAmount) || 0,
            }));
            setSalaryFields(fields);
            setOriginalFields(fields);
        }
        setLoading(false);
    }, [debouncedEmail, userId, userType]);

    useEffect(() => {
        load();
    }, [load]);

    return { salaryFields, setSalaryFields, originalFields, loading, refetch: load };
};

// Drives the New Hire wizard's Salary step with the same CTC Calculator engine used by
// the regular Add Employee flow (SalaryInfo.tsx) — an Annual CTC input that auto-solves
// Basic/HRA/etc, employer PF, and Cost to Company — instead of the old flat per-component
// form. A brand-new hire has no existing employee record yet, so earnings always start
// from the org's GLOBAL component templates (getCurrentSalaryComponent), never looked up
// by email — an email-based lookup (like useNewHireSalaryFields above) risks silently
// matching an unrelated EXISTING employee's frozen overrides whenever the typed email
// happens to coincide with theirs, leaking that person's real salary data into a brand-
// new hire's form. Deductions are likewise org-wide and need no employee context.
export const useNewHireCtcSalary = () => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { complianceData } = useGetComplianceSettingsApi();
    const epfPolicy = resolveEpfPolicyFromComplianceSettings(complianceData);
    // The candidate is created on submit, so they aren't in the EPF headcount yet (+1) —
    // pending new hires count toward the 20-employee rule the moment they're added.
    const { applicability: epfApplicability } = useEpfApplicabilityApi();
    const epfApplicable = resolveEpfApplicableForJoiners(complianceData, epfApplicability, 1);
    const epfTurnsOnWithThisHire = willEpfBecomeMandatory(epfApplicability, 1);
    const showPfInEarnings = resolveShowPfInEarningsFromComplianceSettings(complianceData, epfApplicable);
    const { data: deductionComponents, tableLoading: deductionLoading } = useGetAllDeductions(
        1,
        100,
        '',
        false,
        true
    );

    const [earningComponents, setEarningComponents] = useState<any[]>([]);
    const [earningsLoading, setEarningsLoading] = useState(true);
    const [taxRegime, setTaxRegime] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const data = await getCurrentSalaryComponent({ userId, userType });
            if (cancelled) return;
            if (data) setEarningComponents(data.componentData || []);
            setEarningsLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, userType]);

    const ctcState = useCtcCalculatorState(epfPolicy, epfApplicable, showPfInEarnings);
    const { hydrated, hydrate } = ctcState;

    // Global components don't depend on the candidate being typed in, so a plain
    // once-ever hydrate (unlike the email-scoped New Hire salary this used to be) is
    // correct here: there's nothing candidate-specific to go stale or need re-fetching.
    useEffect(() => {
        if (hydrated || earningsLoading || deductionLoading) return;
        hydrate(
            mapSalaryComponentsToEarnings(earningComponents),
            mapDeductionComponentsToDeductions(deductionComponents)
        );
    }, [
        hydrated,
        earningsLoading,
        deductionLoading,
        earningComponents,
        deductionComponents,
        hydrate,
    ]);

    return {
        ...ctcState,
        taxRegime,
        setTaxRegime,
        loading: earningsLoading || deductionLoading,
        epfTurnsOnWithThisHire,
        epfMandatoryThreshold: epfApplicability?.mandatoryThreshold,
    };
};

type SalaryStepProps = {
    salary: ReturnType<typeof useNewHireCtcSalary>;
};

export const SalaryStep = ({ salary }: SalaryStepProps) => {
    const {
        annualCTC,
        setAnnualCTC,
        breakdown,
        upsertEarning,
        removeEarning,
        upsertDeduction,
        removeDeduction,
        hasBalancingEarning,
        taxRegime,
        setTaxRegime,
        loading,
        hydrated,
    } = salary;

    const [earningDrawer, setEarningDrawer] = useState<{
        open: boolean;
        earning: CtcEarningComponent | null;
    }>({ open: false, earning: null });
    const [deductionDrawer, setDeductionDrawer] = useState<{
        open: boolean;
        deduction: CtcDeductionComponent | null;
    }>({ open: false, deduction: null });

    if (loading && !hydrated) return <Skeleton />;

    return (
        <Flex vertical gap={20}>
            <Flex vertical gap={8} className="items-center mb-2">
                <Typography.Text className="font-medium" style={{ color: '#181D27' }}>
                    Annual CTC
                </Typography.Text>
                <Flex align="center" justify="center" gap={16}>
                    <InputNumber
                        value={annualCTC || undefined}
                        onChange={value => setAnnualCTC(Number(value) || 0)}
                        prefix={<span className="text-textGreyColor text-sm pr-1">₹</span>}
                        size="large"
                        style={{ width: 400 }}
                        min={0}
                        controls={false}
                        formatter={value => (value ? Number(value).toLocaleString('en-IN') : '')}
                        parser={value => Number((value || '').replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 6,00,000"
                    />
                    <Typography.Text
                        className="text-sm whitespace-nowrap"
                        style={{ color: '#535862' }}
                    >
                        = ₹ {Math.round(breakdown.monthlyCTC).toLocaleString('en-IN')} / month
                    </Typography.Text>
                </Flex>
            </Flex>

            {salary.epfTurnsOnWithThisHire && (
                <Alert
                    className="mt-6"
                    type="info"
                    showIcon
                    message={`This hire takes you to ${salary.epfMandatoryThreshold} employees — EPF becomes mandatory and will be turned on automatically for your establishment, so PF is included below.`}
                />
            )}

            <CtcBreakdownCard
                breakdown={breakdown}
                editable
                onAddEarning={() => setEarningDrawer({ open: true, earning: null })}
                onEditEarning={earning => setEarningDrawer({ open: true, earning })}
                onRemoveEarning={removeEarning}
                onAddDeduction={() => setDeductionDrawer({ open: true, deduction: null })}
                onEditDeduction={deduction => setDeductionDrawer({ open: true, deduction })}
                onRemoveDeduction={removeDeduction}
            />

            <Flex vertical gap={2} className="mt-2">
                <Typography.Text className="font-medium">
                    Select tax regime{' '}
                    <Typography.Text className="text-textGrey font-normal">
                        (optional)
                    </Typography.Text>
                </Typography.Text>
                <Radio.Group
                    value={taxRegime}
                    onChange={e => setTaxRegime(e.target.value)}
                    className="flex gap-6 mt-2"
                >
                    <Radio value="New Tax Regime">New Tax Regime</Radio>
                    <Radio value="Old Tax Regime">Old Tax Regime</Radio>
                </Radio.Group>
            </Flex>

            {earningDrawer.open && (
                <CtcEarningDrawer
                    open={earningDrawer.open}
                    selectedEarning={earningDrawer.earning}
                    allowBalancing={!hasBalancingEarning || !!earningDrawer.earning}
                    breakdown={breakdown}
                    onClose={() => setEarningDrawer({ open: false, earning: null })}
                    onSave={upsertEarning}
                />
            )}
            {deductionDrawer.open && (
                <CtcDeductionDrawer
                    open={deductionDrawer.open}
                    selectedDeduction={deductionDrawer.deduction}
                    onClose={() => setDeductionDrawer({ open: false, deduction: null })}
                    onSave={upsertDeduction}
                />
            )}
        </Flex>
    );
};

// Persists the CTC engine's resolved earnings via employeeEmail — the employee record
// doesn't exist yet at this point in the New Hire wizard (submitNewHire runs after this),
// mirroring SalaryInfo.tsx's Add Employee flow so a new hire's salary structure is created
// the same way an existing employee's would be.
export const submitNewHireSalary = async (
    breakdown: { earnings: CtcEarningComponent[] },
    email: string,
    userId: number,
    userType: string
) => {
    // The synthetic "PF Employee's Contribution" row is a display echo of the EPF
    // deduction, not a real earning component, so it's excluded here (see SalaryInfo.tsx).
    const resolvedEarnings = breakdown.earnings.filter(
        earning => !earning.id.endsWith('-employee-pf-mirror') && !isPfEarningsLine(earning)
    );
    await Promise.all(
        resolvedEarnings.map(earning => {
            const isPercentage = earning.calculationType === 'PERCENTAGE';
            return createEmployeeSalaryComponent({
                globalComponentId: earning.isGlobal ? earning.id : undefined,
                componentName: earning.componentName,
                calculationType: earning.calculationType,
                amountPercentage: isPercentage
                    ? Number((earning.amountPercentage ?? 0).toFixed(2))
                    : Number(earning.calculatedAmount.toFixed(2)),
                ...(isPercentage && {
                    calculationBasis: earning.calculationBasis,
                    calculationBasedOn: earning.calculationBasedOn,
                }),
                status: 'ACTIVE',
                employeeEmail: email,
                isGlobal: false,
                userId,
                userType,
            } as any);
        })
    );
};

// Deductions require a real employee id (unlike earnings, which can be linked by email),
// so this runs AFTER submitNewHire has created the employee — mirrors SalaryInfo.tsx's
// post-creation deduction step exactly.
export const submitNewHireDeductions = async (
    breakdown: { deductions: CtcDeductionComponent[] },
    employeeId: string,
    userId: number,
    userType: string
) => {
    await Promise.all(
        breakdown.deductions.map(deduction =>
            createEmployeeDeductionComponent({
                globalComponentId: deduction.isGlobal ? deduction.id : undefined,
                deductionName: deduction.deductionName,
                calculationType: 'FIXED',
                amountPercentage: Number(deduction.calculatedAmount.toFixed(2)),
                calculationBasis: 'MONTHLY',
                status: 'ACTIVE',
                eId: employeeId,
                userId,
                userType,
            } as any)
        )
    );
};

export const submitSalaryCustomizations = async (
    salaryFields: SalaryField[],
    originalFields: SalaryField[],
    email: string,
    userId: number,
    userType: string
) => {
    const customized = salaryFields.filter(field => {
        const original = originalFields.find(o => o.id === field.id);
        return original && Number(original.calculatedAmount) !== field.calculatedAmount;
    });
    if (customized.length === 0) return;
    await Promise.all(
        customized.map(field => {
            // Matches useSalaryCompActions' createPayload: link by id if already a
            // CUSTOM override (update, not duplicate), else by globalComponentId.
            const conditionalPayload = field.isGlobal
                ? { globalComponentId: field.id }
                : { id: field.id };
            return createEmployeeSalaryComponent({
                ...conditionalPayload,
                componentName: field.componentName,
                calculationType: 'FIXED',
                calculationBasedOn: '',
                amountPercentage: field.calculatedAmount,
                status: 'ACTIVE',
                employeeEmail: email,
                corporateUser: userId,
                isGlobal: false,
                userId,
                userType,
            } as any);
        })
    );
};

type OfferLetterStepProps = {
    file: File | null;
    setFile: Dispatch<SetStateAction<File | null>>;
    signatureFields: SignatureField[];
    setSignatureFields: Dispatch<SetStateAction<SignatureField[]>>;
    signerValues: SignerValues;
    setSignerValues: Dispatch<SetStateAction<SignerValues>>;
    signerExpanded: boolean;
    setSignerExpanded: Dispatch<SetStateAction<boolean>>;
};

export const OfferLetterStep = ({
    file,
    setFile,
    signatureFields,
    setSignatureFields,
    signerValues,
    setSignerValues,
    signerExpanded,
    setSignerExpanded,
}: OfferLetterStepProps) => {
    const { values } = useFormikContext<any>();
    const dispatch = useAppDispatch();
    const departmentLabel = values.departmentLabel || '—';
    const [isDragOverUpload, setIsDragOverUpload] = useState(false);

    const handleFileSelect = (f: File) => {
        if (f.type !== 'application/pdf') {
            dispatch(showToast({ description: 'Please upload a PDF file.', variant: 'error' }));
            return;
        }
        if (f.size > MAX_OFFER_LETTER_SIZE) {
            dispatch(
                showToast({ description: 'File size must be smaller than 5 MB', variant: 'error' })
            );
            return;
        }
        setFile(f);
    };

    const fieldsCount = signatureFields.filter(f => f.signerIndex === 0).length;

    const signerPanel = (
        <Flex vertical gap={12} className="w-full mt-4 xl:mt-0 xl:ml-6 xl:w-[300px] shrink-0">
            <Typography.Text className="text-sm font-semibold text-[#1E293B]">
                Employee Signature
            </Typography.Text>
            <OfferLetterSignerCard
                values={signerValues}
                fieldsCount={fieldsCount}
                isExpanded={signerExpanded}
                onExpand={() => setSignerExpanded(prev => !prev)}
                onChange={setSignerValues}
            />
        </Flex>
    );

    return (
        <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
            <Flex
                vertical
                gap={8}
                className="bg-[#F9FAFB] border border-solid border-[#E5E7EB] rounded-lg p-4 mb-4"
            >
                <Row gutter={[16, 8]}>
                    <Col span={12}>
                        <Typography.Text className="text-xs text-[#969696] uppercase block">
                            Name
                        </Typography.Text>
                        <Typography.Text className="font-medium">
                            {values.firstName || values.lastName
                                ? `${values.firstName} ${values.lastName}`.trim()
                                : '—'}
                        </Typography.Text>
                    </Col>
                    <Col span={12}>
                        <Typography.Text className="text-xs text-[#969696] uppercase block">
                            Email
                        </Typography.Text>
                        <Typography.Text className="font-medium">
                            {values.email || '—'}
                        </Typography.Text>
                    </Col>
                    <Col span={12}>
                        <Typography.Text className="text-xs text-[#969696] uppercase block">
                            Role
                        </Typography.Text>
                        <Typography.Text className="font-medium">
                            {values.designation || '—'}
                        </Typography.Text>
                    </Col>
                    <Col span={12}>
                        <Typography.Text className="text-xs text-[#969696] uppercase block">
                            Joining Date
                        </Typography.Text>
                        <Typography.Text className="font-medium">
                            {values.dateOfJoin
                                ? dayjs(values.dateOfJoin).format('DD MMM YYYY')
                                : '—'}
                        </Typography.Text>
                    </Col>
                    <Col span={12}>
                        <Typography.Text className="text-xs text-[#969696] uppercase block">
                            Department
                        </Typography.Text>
                        <Typography.Text className="font-medium">{departmentLabel}</Typography.Text>
                    </Col>
                </Row>
            </Flex>

            <Flex vertical gap={1} className="mb-4">
                <TypographyText className="text-lg font-semibold text-gray-900">
                    Upload Document &amp; E-Sign Setup
                </TypographyText>
                <TypographyText className="text-sm text-gray-500">
                    Upload the offer letter, then mark where this candidate signs. This candidate
                    gets an email link and signs with an email OTP or an Aadhaar OTP, depending on
                    the eSign type you choose. No account needed.
                </TypographyText>
            </Flex>

            {file ? (
                <Flex gap={0} className="flex-col xl:flex-row" align="flex-start">
                    <Flex vertical className="flex-1 min-w-0 w-full">
                        <PDFViewer
                            file={file}
                            signatureFields={signatureFields}
                            editable
                            onFileRemove={() => {
                                setFile(null);
                                setSignatureFields([]);
                            }}
                            onSignatureFieldsChange={setSignatureFields}
                            getSignerName={() => signerValues.name || 'Signer 1'}
                            getSignerColor={() => ({
                                bg: '#D9EECC',
                                border: '#05BE63',
                                text: '#15803D',
                            })}
                        />
                    </Flex>
                    {signerPanel}
                </Flex>
            ) : (
                <label
                    htmlFor="offer-letter-pdf-upload"
                    className={`w-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${isDragOverUpload ? 'border-[#FF4F4F] bg-red-50' : 'border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#FF4F4F] hover:bg-red-50'}`}
                    style={{ minHeight: 360, padding: 'clamp(24px, 5vw, 64px) 24px' }}
                    onDragOver={e => {
                        e.preventDefault();
                        setIsDragOverUpload(true);
                    }}
                    onDragLeave={() => setIsDragOverUpload(false)}
                    onDrop={e => {
                        e.preventDefault();
                        setIsDragOverUpload(false);
                        const f = e.dataTransfer.files[0];
                        if (f) handleFileSelect(f);
                    }}
                >
                    <CloudUploadOutlined className="text-5xl text-[#CBD5E1] mb-4" />
                    <Typography.Text className="text-base font-semibold text-[#374151] mb-1 block text-center">
                        Drag &amp; drop your PDF here
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#9CA3AF] mb-4 block text-center">
                        or
                    </Typography.Text>
                    <div className="h-9 px-6 flex items-center justify-center bg-[#FF4F4F] text-white text-sm font-medium rounded-lg pointer-events-none">
                        Browse File
                    </div>
                    <Typography.Text className="text-xs text-[#9CA3AF] mt-3 block text-center">
                        Supports PDF files only, max 5 MB
                    </Typography.Text>
                    <input
                        id="offer-letter-pdf-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        style={{ display: 'none' }}
                        onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleFileSelect(f);
                        }}
                    />
                </label>
            )}
        </Form>
    );
};
