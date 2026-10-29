import { useMemo, useState } from 'react';

import { Form as AntForm } from 'antd';
import * as Yup from 'yup';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import CompanySection from './CompanySection';
import RenewalTypeSection from './RenewalTypeSection';
import useCreateRenewalRequest from '../../hooks/useCreateRenewalRequest';
import useRenewalFormConfig, {
    RenewalFormConfig,
    RenewalFormField,
} from '../../hooks/useRenewalFormConfig';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type Jurisdiction = { country?: string; company_type?: string; freezone?: string };

const requiredMessageFor = (type: string, label: string) => {
    const lower = (label || '').toLowerCase();
    switch (type) {
        case 'select':
        case 'radio':
        case 'date':
            return `Please select the ${lower}`;
        case 'file':
        case 'image':
            return `Please upload the ${lower}`;
        case 'checkbox':
            return `Please confirm the ${lower}`;
        case 'text':
        case 'textarea':
        case 'email':
        case 'number':
        default:
            return `Please enter the ${lower}`;
    }
};

// Build a Yup shape for a single section's fields. Supports the five types
// Base93's form-config emits: text / email / number / date / file. For `file`
// we don't use `.required()` (Yup.mixed().required treats empty objects as
// valid) — use an explicit `.test` instead.
const buildAdditionalFieldsShape = (fields: RenewalFormField[]) => {
    const shape: Record<string, Yup.AnySchema> = {};
    fields.forEach(field => {
        let validator: Yup.AnySchema;
        switch (field.type) {
            case 'email':
                validator = Yup.string().email(`${field.label} must be a valid email`);
                break;
            case 'number':
                validator = Yup.number().typeError(`${field.label} must be a number`);
                break;
            case 'date':
                validator = Yup.string();
                break;
            case 'file':
                // `.nullable()` — we seed file-field values as `null` so Formik
                // tracks the path for touched/error rendering; Yup's default
                // non-nullable mixed() would surface "cannot be null" instead
                // of our readable "<label> is required" test below.
                validator = Yup.mixed().nullable();
                break;
            case 'text':
            default:
                validator = Yup.string();
                break;
        }

        if (field.validation?.required) {
            const message = requiredMessageFor(field.type, field.label);
            if (field.type === 'file') {
                validator = validator.test(
                    'required',
                    message,
                    value => value != null && value !== ''
                );
            } else {
                validator = validator.required(message);
            }
        } else if (field.type !== 'file') {
            validator = (validator as Yup.StringSchema | Yup.NumberSchema).notRequired();
        }

        shape[field.name] = validator;
    });
    return Yup.object().shape(shape);
};

const buildRenewalRequestSchema = (configs: RenewalFormConfig[], requireFreezone: boolean) =>
    Yup.lazy((values: any) => {
        const renewalType = values?.renewal_type;
        const config = configs.find(c => c.renewal_type === renewalType);
        const fields = config?.sections.flatMap(s => s.fields) ?? [];

        return Yup.object()
            .shape({
                is_external: Yup.boolean().default(false),
                company: Yup.string().nullable(),
                external_company: Yup.object()
                    .shape({
                        name: Yup.string().max(200),
                        country: Yup.string(),
                        company_type: Yup.string(),
                        freezone: Yup.string(),
                    })
                    .nullable(),
                renewal_type: Yup.string().required('Please select the renewal type'),
                additional_fields: buildAdditionalFieldsShape(fields),
            })
            .test('company-or-external', '', function companyOrExternal(v) {
                const { is_external, company, external_company } = v || {};
                if (is_external) {
                    if (!external_company?.name) {
                        return this.createError({
                            path: 'external_company.name',
                            message: 'Please enter the company name',
                        });
                    }
                    if (!external_company?.country) {
                        return this.createError({
                            path: 'external_company.country',
                            message: 'Please select the country',
                        });
                    }
                    if (!external_company?.company_type) {
                        return this.createError({
                            path: 'external_company.company_type',
                            message: 'Please select the company type',
                        });
                    }
                    if (requireFreezone && !external_company?.freezone) {
                        return this.createError({
                            path: 'external_company.freezone',
                            message: 'Please select the freezone',
                        });
                    }
                } else if (!company) {
                    return this.createError({
                        path: 'company',
                        message: 'Please enter the company name',
                    });
                }
                return true;
            });
    });

export default function RequestModal({ isOpen, onClose, onSuccess }: Props) {
    const [jurisdiction, setJurisdiction] = useState<Jurisdiction>({});
    const [hasFreezone, setHasFreezone] = useState(false);
    const { submit, isSubmitting } = useCreateRenewalRequest();

    const isExternalExpected = false;
    const hasJurisdictionForConfig = isExternalExpected
        ? !!(jurisdiction.country && jurisdiction.company_type)
        : !!jurisdiction.country;

    const { configs, isFetched, isLoading } = useRenewalFormConfig({
        country: jurisdiction.country,
        company_type: jurisdiction.company_type,
        freezone: jurisdiction.freezone,
        enabled: hasJurisdictionForConfig,
    });

    const validationSchema = useMemo(
        () => buildRenewalRequestSchema(configs, hasFreezone),
        [configs, hasFreezone]
    );

    return (
        <CustomModalWithForm
            open={isOpen}
            handleCancel={onClose}
            modalTitle="Submit Renewal Request"
            width={520}
            isLoading={isSubmitting}
            firstBtnTxt="Submit"
            secondBtnTxt="Cancel"
            initialValues={{
                is_external: false,
                company: '',
                external_company: null,
                renewal_type: '',
                additional_fields: {},
            }}
            validationSchema={validationSchema}
            handleFormSubmit={async values => {
                const res = await submit({
                    is_external: !!values.is_external,
                    company: values.company || undefined,
                    external_company: (values as any).external_company,
                    renewal_type: values.renewal_type,
                    additional_fields: (values as any).additional_fields || {},
                });
                if (res) {
                    onSuccess?.();
                    onClose();
                }
            }}
        >
            <AntForm layout="vertical" requiredMark className="!mb-0">
                <div className="flex flex-col gap-4">
                    <CompanySection
                        onJurisdictionChange={setJurisdiction}
                        onFreezoneAvailabilityChange={setHasFreezone}
                    />
                    <RenewalTypeSection
                        jurisdiction={jurisdiction}
                        configs={configs}
                        isFetched={isFetched}
                        isLoading={isLoading}
                    />
                </div>
            </AntForm>
        </CustomModalWithForm>
    );
}
