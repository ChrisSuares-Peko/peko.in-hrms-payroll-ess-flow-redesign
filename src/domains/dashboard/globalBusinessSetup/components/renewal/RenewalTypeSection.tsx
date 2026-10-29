import { useEffect, useMemo } from 'react';

import { Alert } from 'antd';
import { useFormikContext } from 'formik';

import DynamicRenewalFields from './DynamicRenewalFields';
import { RenewalFormConfig } from '../../hooks/useRenewalFormConfig';
import SelectInputWithSearchAndIcon from '../atomic/SelectInputWithSearchAndIcon';

interface Props {
    jurisdiction: { country?: string; company_type?: string; freezone?: string };
    configs: RenewalFormConfig[];
    isFetched: boolean;
    isLoading: boolean;
}

export default function RenewalTypeSection({ jurisdiction, configs, isFetched, isLoading }: Props) {
    const { values, setFieldValue } = useFormikContext<any>();
    const { country, company_type, freezone } = jurisdiction;

    const isExternal = !!values.is_external;
    const hasJurisdiction = isExternal ? !!(country && company_type) : !!country;

    useEffect(() => {
        setFieldValue('renewal_type', '');
        setFieldValue('additional_fields', {});
    }, [country, company_type, freezone, setFieldValue]);

    const typeOptions = useMemo(
        () => configs.map(c => ({ value: c.renewal_type, label: c.renewal_type })),
        [configs]
    );
    const selectedConfig = configs.find(c => c.renewal_type === values.renewal_type);

    // Seed `additional_fields` with empty scaffolds so Formik knows about every
    // dynamic field path. Without this, Formik's submit-time
    // `setNestedObjectValues(values, true)` can't walk into the empty object,
    // `touched.additional_fields.<name>` stays undefined, and the inline
    // `meta.touched && meta.error` render condition on each input never fires.
    useEffect(() => {
        if (!selectedConfig) {
            setFieldValue('additional_fields', {});
            return;
        }
        const seeded: Record<string, unknown> = {};
        selectedConfig.sections.forEach(section => {
            section.fields.forEach(field => {
                seeded[field.name] = field.type === 'file' ? null : '';
            });
        });
        setFieldValue('additional_fields', seeded);
    }, [values.renewal_type, selectedConfig, setFieldValue]);
    const noConfigs = hasJurisdiction && isFetched && !isLoading && configs.length === 0;

    if (!hasJurisdiction) return null;

    return (
        <div className="flex flex-col gap-2">
            {noConfigs && (
                <Alert
                    type="warning"
                    showIcon
                    message="No renewal types are configured for this jurisdiction."
                />
            )}

            {configs.length > 0 && (
                <SelectInputWithSearchAndIcon
                    label="Renewal Type"
                    name="renewal_type"
                    placeholder="Select renewal type"
                    options={typeOptions}
                    loading={isLoading}
                    isRequired
                />
            )}

            {selectedConfig && selectedConfig.sections.length > 0 && (
                <DynamicRenewalFields sections={selectedConfig.sections} />
            )}
        </div>
    );
}
