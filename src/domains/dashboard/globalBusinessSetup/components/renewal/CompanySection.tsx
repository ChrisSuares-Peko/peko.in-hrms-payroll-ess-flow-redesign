import { useEffect } from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useField, useFormikContext } from 'formik';

import CompanyAutocomplete from './CompanyAutocomplete';
import ExternalCompanyFields from './ExternalCompanyFields';

interface Props {
    onJurisdictionChange: (j: {
        country?: string;
        company_type?: string;
        freezone?: string;
    }) => void;
    onFreezoneAvailabilityChange?: (hasFreezone: boolean) => void;
}

export default function CompanySection({
    onJurisdictionChange,
    onFreezoneAvailabilityChange,
}: Props) {
    const [field] = useField('is_external');
    const { setFieldValue } = useFormikContext<any>();
    const isExternal: boolean = !!field.value;

    useEffect(() => {
        if (!isExternal) {
            setFieldValue('external_company', null);
            onJurisdictionChange({ country: '', company_type: '', freezone: '' });
        } else {
            setFieldValue('company', '');
            // Seed external_company as an object so Formik's submit-time
            // setNestedObjectValues can recurse and mark nested fields touched.
            // Otherwise touched.external_company collapses to a leaf `true` and
            // the per-field "Please enter / select ..." errors never render.
            setFieldValue('external_company', {
                name: '',
                country: '',
                company_type: '',
                freezone: '',
            });
        }
    }, [isExternal, onJurisdictionChange, setFieldValue]);

    if (isExternal) {
        return (
            <div className="flex flex-col gap-2">
                <Button
                    type="link"
                    size="small"
                    icon={<ArrowLeftOutlined />}
                    className="!p-0 self-start"
                    danger
                    onClick={() => setFieldValue('is_external', false)}
                >
                    Back to company search
                </Button>
                <ExternalCompanyFields
                    onJurisdictionChange={onJurisdictionChange}
                    onFreezoneAvailabilityChange={onFreezoneAvailabilityChange}
                />
            </div>
        );
    }

    return (
        <CompanyAutocomplete
            onJurisdictionChange={onJurisdictionChange}
            onRequestNewCompany={() => setFieldValue('is_external', true)}
        />
    );
}
