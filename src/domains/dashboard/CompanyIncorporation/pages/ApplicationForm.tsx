import { useEffect, useRef } from 'react';

import { Button, Flex, Form as AntForm, Spin, Typography } from 'antd';
import { Formik, Form } from 'formik';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScrollUpOnPageChange from '@src/hooks/useScrollTopOnPageChange';

import StepIndicator from '../components/StepIndicator';
import BasicDetails from '../components/steps/BasicDetails';
import BusinessActivity from '../components/steps/BusinessActivity';
import Capital from '../components/steps/Capital';
import Directors from '../components/steps/Directors';
import Documents from '../components/steps/Documents';
import LlpAgreement from '../components/steps/LlpAgreement';
import MoaAoa from '../components/steps/MoaAoa';
import Review from '../components/steps/Review';
import { useIncorporationForm } from '../hooks/useIncorporationForm';
import {
    basicDetailsSchema,
    getDirectorsSchema,
    directorsSchemaLLP,
    getCapitalSchema,
    capitalSchemaLLP,
    businessActivitySchema,
    moaAoaSchema,
    llpAgreementSchema,
    documentsSchema,
} from '../schema';
import { updateApplicationData, setLoading } from '../slices/incorporationSlice';
import { ApplicationPayload, DirectorInfo, EntityType, NomineeInfo, Shareholder } from '../types';

const { Title, Paragraph } = Typography;

// Documents UI in Documents.tsx names fields in camelCase
// (e.g. `director_0_proofOfIdentity`, `nocFromOwner`) but sends docType in
// snake_case to the backend (`director_0_proof_of_identity`, `noc_from_owner`)
// via toDocType. When hydrating an existing application, we get docType back
// and need to convert it to the original fieldName so Formik populates the
// correct field.
const snakeToCamel = (s: string): string =>
    s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const docTypeToFieldName = (docType: string): string => {
    const m = docType.match(/^(director_\d+)_(.+)$/);
    if (m) return `${m[1]}_${snakeToCamel(m[2])}`;
    return snakeToCamel(docType);
};

const ApplicationForm = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { currentStep, handleStepChange, handleSubmit, isLoading, isHydrating } =
        useIncorporationForm();
    const { currentApplication } = useAppSelector(state => state.reducer.incorporation);
    const formikRef = useRef<any>(null);

    useEffect(() => {
        dispatch(setLoading(false));
    }, [dispatch]);

    useScrollUpOnPageChange(currentStep);

    const entityType = currentApplication?.entityType;

    const STEP_TITLES = [
        'Basic Details',
        entityType === EntityType.LLP ? 'Designated Partners & DSC/DIN' : 'Directors & DSC/DIN',
        'Capital & Shareholding',
        'Business Activity',
        entityType === EntityType.LLP ? 'LLP Agreement' : 'MOA & AOA',
        'Document Uploads',
        'Review & Submit',
    ];

    const initialValues: ApplicationPayload = {
        ...(currentApplication || {}),
        applicantDetails: currentApplication?.applicantDetails || {
            fullName: '',
            email: '',
            mobile: '',
            state: '',
        },
        entityType: currentApplication?.entityType || '',
        proposedNames: currentApplication?.proposedNames || {
            firstChoice: '',
            secondChoice: '',
        },
        registeredOffice: currentApplication?.registeredOffice || {
            availability: 'need',
            officeType: '',
            address: '',
            state: '',
            hasUtilityBill: false,
            hasIdProof: false,
        },
        directors: (() => {
            const stored = currentApplication?.directors;
            const emptyDir = { name: '', nationality: '', email: '', mobile: '', panNumber: '', passportNumber: '', din: '', hasDIN: false, hasDSC: false, requestDINfromPeko: false, requestDSCfromPeko: false, educationQualification: '', occupation: '', placeOfBirth: { state: '', district: '' } };
            if (entityType === EntityType.OPC) {
                return stored?.length ? [stored[0]] : [emptyDir];
            }
            if (entityType === EntityType.LLP) {
                return stored?.length ? stored : [emptyDir];
            }
            return stored?.length ? stored : [emptyDir];
        })(),
        additionalShareholders: currentApplication?.additionalShareholders || [],
        nominee: (currentApplication?.nominee || {
            name: '',
            nationality: '',
            email: '',
            mobile: '',
            panNumber: '',
            passportNumber: '',
            din: '',
            aadhaar: '',
            hasDIN: false,
            requestDINfromPeko: false,
            educationQualification: '',
            occupation: '',
            placeOfBirth: { state: '', district: '' },
        }) as NomineeInfo,
        capital: currentApplication?.capital || {
            authorizedCapital: 0,
            paidUpCapital: 0,
            shareholders: [],
        },
        businessActivity: currentApplication?.businessActivity || {
            section: '',
            division: '',
            group: '',
            class: '',
            subclass: '',
            secondaryActivity: '',
            otherActivities: '',
            description: '',
        },
        moaAoa: currentApplication?.moaAoa || {
            moaType: 'standard',
            aoaType: 'standard',
            confirmed: false,
            mainObjectTemplate: undefined,
            mainObjectCustomText: undefined,
            ancillaryObjects: [0, 1, 3, 5, 7, 11],
        },
        llpAgreement: currentApplication?.llpAgreement || {
            agreementType: 'standard',
            partnerRights: {
                accessBooks: true,
                receiveShares: true,
                participateVotes: false,
                indemnified: true,
                separateBusiness: false,
            },
            partnerDuties: {
                accountBenefits: true,
                indemnifyFraud: true,
                renderAccounts: false,
                actInBestInterest: true,
                noCompeting: false,
                maintainConfidentiality: true,
            },
            meetingQuorum: '2',
            votingThreshold: 'Simple Majority (>50%)',
            disputeResolution: {
                method: 'Arbitration (Recommended)',
                jurisdiction: '',
            },
            confirmed: false,
        },
        documents: currentApplication?.documents || { documents: [] },
        // Hydrate top-level doc fields from the nested documents array so the
        // Documents step renders existing uploaded filenames when the user
        // re-enters via the landing page's "View Application" button. We key
        // by the camelCase fieldName (reversing toDocType) because Documents.tsx
        // reads by fieldName, not docType. These entries carry vendorUrl/
        // vendorFileRefUrl (no fileBase64), so they're filtered out by
        // collectDocuments and won't be re-uploaded.
        ...Object.fromEntries(
            (currentApplication?.documents?.documents || []).map(d => [
                docTypeToFieldName(d.docType),
                d,
            ])
        ),
    } as ApplicationPayload;

    const validationSchemas = [
        basicDetailsSchema,
        entityType === EntityType.LLP ? directorsSchemaLLP : getDirectorsSchema(entityType ?? ''),
        entityType === EntityType.LLP ? capitalSchemaLLP : getCapitalSchema(entityType ?? ''),
        businessActivitySchema,
        entityType === EntityType.LLP ? llpAgreementSchema : moaAoaSchema,
        documentsSchema,
        null, // Review step - no validation needed
    ];

    const setAllTouched = (obj: Record<string, unknown>): Record<string, unknown> =>
        Object.keys(obj).reduce(
            (acc, key) => {
                const val = obj[key];
                if (Array.isArray(val)) {
                    acc[key] = val.map(item =>
                        item && typeof item === 'object'
                            ? setAllTouched(item as Record<string, unknown>)
                            : undefined
                    );
                } else if (val && typeof val === 'object') {
                    acc[key] = setAllTouched(val as Record<string, unknown>);
                } else {
                    acc[key] = true;
                }
                return acc;
            },
            {} as Record<string, unknown>
        );

    const handleNextStep = async () => {
        if (!formikRef.current) return;

        const schema = validationSchemas[currentStep];
        const { validateForm, setTouched, setErrors, setValues } = formikRef.current;

        if (schema) {
            const errors = await validateForm();
            if (Object.keys(errors).length > 0) {
                setErrors(errors);
                setTouched(
                    setAllTouched(formikRef.current.values as Record<string, unknown>),
                    false
                );
                // Wait one frame so React renders the freshly-set errors before we query.
                requestAnimationFrame(() => {
                    const firstError = document.querySelector(
                        '.ant-form-item-has-error, [data-form-error="true"]'
                    );
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
                return;
            }
        }

        let valuesToDispatch = formikRef.current.values;

        // When entity type changes on step 0, clear entity-specific sections and stale validation state
        if (currentStep === 0 && valuesToDispatch.entityType !== currentApplication?.entityType) {
            const isNewLLP = valuesToDispatch.entityType === EntityType.LLP;
            valuesToDispatch = {
                ...valuesToDispatch,
                moaAoa: isNewLLP
                    ? undefined
                    : {
                          moaType: 'standard',
                          aoaType: 'standard',
                          confirmed: false,
                          mainObjectTemplate: undefined,
                          mainObjectCustomText: undefined,
                          ancillaryObjects: [0, 1, 3, 5, 7, 11],
                      },
                llpAgreement: isNewLLP
                    ? {
                          agreementType: 'standard',
                          partnerRights: {
                              accessBooks: true,
                              receiveShares: true,
                              participateVotes: false,
                              indemnified: true,
                              separateBusiness: false,
                          },
                          partnerDuties: {
                              accountBenefits: true,
                              indemnifyFraud: true,
                              renderAccounts: false,
                              actInBestInterest: true,
                              noCompeting: false,
                              maintainConfidentiality: true,
                          },
                          meetingQuorum: '2',
                          votingThreshold: 'Simple Majority (>50%)',
                          disputeResolution: {
                              method: 'Arbitration (Recommended)',
                              jurisdiction: '',
                          },
                          confirmed: false,
                      }
                    : undefined,
            };
            // setValues syncs Formik internal state to match what we're dispatching
            setValues(valuesToDispatch);
            setTouched({});
            setErrors({});
        }

        // For LLP moving from Directors → Capital, pre-sync partners into capital.shareholders
        // so that when enableReinitialize reinitializes Formik from Redux, the table is already populated
        if (currentStep === 1 && valuesToDispatch.entityType === EntityType.LLP) {
            const dirs = valuesToDispatch.directors || [];
            const existing = valuesToDispatch.capital?.shareholders || [];
            const synced: Shareholder[] = dirs.map((d: DirectorInfo) => {
                const prev = existing.find((sh: Shareholder) => sh.name === d.name);
                return {
                    name: d.name,
                    email: d.email || '',
                    mobile: d.mobile || '',
                    panNumber: d.panNumber || '',
                    nationality: d.nationality || '',
                    shareholding: prev?.shareholding ?? 0,
                    sharesAllotted: prev?.sharesAllotted ?? 0,
                };
            });
            const total = synced.reduce((sum, sh) => sum + (sh.sharesAllotted ?? 0), 0);
            const withPct = synced.map(sh => ({
                ...sh,
                shareholding: total > 0
                    ? parseFloat((((sh.sharesAllotted ?? 0) / total) * 100).toFixed(2))
                    : 0,
            }));
            valuesToDispatch = {
                ...valuesToDispatch,
                capital: {
                    ...valuesToDispatch.capital,
                    shareholders: withPct,
                    authorizedCapital: total,
                },
            };
            setValues(valuesToDispatch);
        }

        dispatch(updateApplicationData(valuesToDispatch));
        handleStepChange(currentStep + 1);
    };

    const stepComponents = [
        <BasicDetails key="step-0" />,
        <Directors key="step-1" entityType={entityType} />,
        <Capital key="step-2" entityType={entityType} />,
        <BusinessActivity key="step-3" />,
        entityType === EntityType.LLP ? (
            <LlpAgreement key="step-4" onEditStep={handleStepChange} />
        ) : (
            <MoaAoa key="step-4" />
        ),
        <Documents key="step-5" />,
        <Review key="step-6" onEditStep={handleStepChange} />,
    ];

    if (isLoading || isHydrating)
        return (
            <Flex justify="center" align="center" style={{ minHeight: '70vh' }}>
                <Spin size="large" />
            </Flex>
        );

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            {/* Page Title */}
            <div className="max-w-4xl mx-auto text-center mb-6 sm:mb-10">
                <Title
                    level={2}
                    className="!text-[20px] sm:!text-[28px] !font-semibold !text-[#383838] !tracking-[-0.14px] !mb-2"
                >
                    Incorporate Your Company
                </Title>
                <Paragraph className="!mb-0 text-[12px] sm:text-[14px] text-[rgba(56,56,56,0.75)] leading-[20px]">
                    Complete digital company registration with the Ministry of Corporate Affairs
                    (MCA)
                </Paragraph>
            </div>

            {/* Step Progress */}
            <div className="max-w-5xl mx-auto">
                <StepIndicator currentStep={currentStep} entityType={entityType} />
            </div>

            <div className="max-w-4xl mx-auto">
                <Formik
                    innerRef={formikRef}
                    initialValues={initialValues}
                    validationSchema={validationSchemas[currentStep]}
                    validateOnChange
                    validateOnBlur
                    onSubmit={(_values, { setSubmitting }) => {
                        setSubmitting(false);
                    }}
                    enableReinitialize
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <AntForm layout="vertical" component={false}>
                                <div className="bg-white rounded-[24px] sm:rounded-[36px] p-4 sm:p-10 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)] [&_.ant-form-item]:!mb-3">
                                    {/* Step title */}
                                    <div className="mb-6 sm:mb-10">
                                        <Title
                                            level={3}
                                            className="!text-[20px] sm:!text-[28px] !font-medium !text-neutral-950 !tracking-[-0.14px] !mb-2"
                                        >
                                            {STEP_TITLES[currentStep]}
                                        </Title>
                                        <Paragraph className="!mb-0 text-[12px] sm:text-[16px] text-slate-500">
                                            {currentStep === 0 &&
                                                'Provide your contact information and initial company details'}
                                            {currentStep === 1 &&
                                                (entityType === EntityType.LLP
                                                    ? 'Add designated partner details and DSC/DIN information'
                                                    : 'Add director details and DSC/DIN information')}
                                            {currentStep === 2 &&
                                                'Define authorized capital and shareholding pattern'}
                                            {currentStep === 3 &&
                                                'Describe your business activity and NIC classification'}
                                            {currentStep === 4 &&
                                                (entityType === EntityType.LLP
                                                    ? 'Define the partnership agreement for your Limited Liability Partnership - outlines partner rights, duties, profit sharing, and management structure'
                                                    : 'Define the foundational documents for your company - MOA outlines objectives, AOA defines internal rules')}
                                            {currentStep === 5 &&
                                                'Upload all required KYC and office documents'}
                                            {currentStep === 6 &&
                                                'Review all details before proceeding to payment'}
                                        </Paragraph>
                                    </div>

                                    {stepComponents[currentStep]}
                                </div>
                            </AntForm>

                            <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
                                <Button
                                    onClick={() => {
                                        if (currentStep === 0) {
                                            navigate(paths.companyIncorporation.index);
                                        } else {
                                            dispatch(
                                                updateApplicationData(formikRef.current?.values)
                                            );
                                            handleStepChange(currentStep - 1);
                                        }
                                    }}
                                    block
                                    className="sm:!w-auto !h-[48px] !px-6 !text-[16px] !border-slate-300 !text-slate-600 hover:!bg-gray-50 !rounded-[8px] transition-colors"
                                >
                                    Back
                                </Button>

                                {currentStep === STEP_TITLES.length - 1 ? (
                                    <Button
                                        type="primary"
                                        htmlType="button"
                                        loading={isSubmitting || isLoading}
                                        onClick={() => {
                                            const values = formikRef.current?.values;
                                            if (values) {
                                                dispatch(updateApplicationData(values));
                                                handleSubmit(values);
                                            }
                                        }}
                                        block
                                        className="sm:!w-auto !bg-lightRed hover:!bg-lightRedHover !h-[48px] !px-8 !text-[16px] !font-medium !rounded-[8px] transition-colors"
                                    >
                                        Pay & Submit
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        htmlType="button"
                                        onClick={handleNextStep}
                                        block
                                        className="sm:!w-auto !bg-lightRed hover:!bg-lightRedHover !h-[48px] !px-8 !text-[16px] !font-medium !rounded-[8px] transition-colors"
                                    >
                                        Next →
                                    </Button>
                                )}
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default ApplicationForm;
