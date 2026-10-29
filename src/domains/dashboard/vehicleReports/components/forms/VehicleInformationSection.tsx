import { ReactNode } from 'react';

import { Col, Row } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';

import useVehicleCatalogOptions from '../../hooks/useVehicleCatalogOptions';
import { bodyTypeOptions, vehicleCategoryOptions } from '../../utils/data';
import ReportSectionCard from '../shared/ReportSectionCard';

interface Props {
    title?: string;
    // The valuation form's first select is "Vehicle category" (Car / Bike / …); the
    // inspection form asks for "Body type" (Hatchback / Sedan / …) instead.
    categoryFieldName: 'vehicleCategory' | 'bodyType';
    categoryLabel: string;
    // Vehicle type used to scope the make/model/year/trim catalog lookup. The
    // valuation form scopes by its own category field; the inspection form passes
    // the category picked on the earlier service-select step, since body style
    // doesn't determine the make list.
    taxonomyCategory?: string;
    // The inspection form fills this section's last slot with the reg-number input.
    children?: ReactNode;
}

// Category / make / model / year / trim block, shared by the valuation and
// inspection forms. Make through trim are a live cascade against Peko's Droom MYBIZ
// catalog proxy (see DROOM_MYBIZ_API_REFERENCE.md) — category itself is a fixed local
// enum, since it's an input to that lookup, not something the lookup returns.
const VehicleInformationSection = ({
    title = 'Vehicle information',
    categoryFieldName,
    categoryLabel,
    taxonomyCategory,
    children,
}: Props) => {
    const { values, setFieldValue } = useFormikContext<Record<string, string>>();
    const isVehicleType = categoryFieldName === 'vehicleCategory';
    const categoryOptions = isVehicleType ? vehicleCategoryOptions : bodyTypeOptions;
    const scope = isVehicleType ? values.vehicleCategory : taxonomyCategory;

    const catalog = useVehicleCatalogOptions({
        category: scope ?? '',
        make: values.make,
        model: values.model,
        year: values.manufacturingYear,
    });

    // Every level *below* the one that changed is now stale and must be cleared, not
    // just the immediately-next one — a new make invalidates model, year and trim all
    // at once, since model options are scoped by (category, make), year by (…, model),
    // and trim by (…, year). The changed field's own new value is already in Formik
    // state via the select's own onChange, so it is never touched here.
    const clearDescendantsOf = (level: 'category' | 'make' | 'model' | 'year') => {
        if (level === 'category') setFieldValue('make', '');
        if (level === 'category' || level === 'make') setFieldValue('model', '');
        if (level !== 'year') setFieldValue('manufacturingYear', '');
        setFieldValue('variant', '');
    };

    return (
        <ReportSectionCard title={title}>
            <Row gutter={[24, 20]}>
                <Col xs={24} md={12}>
                    <SelectInput
                        name={categoryFieldName}
                        label={categoryLabel}
                        placeholder={`Select ${categoryLabel.toLowerCase()}`}
                        size="large"
                        options={categoryOptions}
                        // Only the valuation form's category field drives the catalog
                        // scope — the inspection form's body-type field doesn't.
                        handleChange={isVehicleType ? () => clearDescendantsOf('category') : undefined}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInputWithSearch
                        name="make"
                        label="Make"
                        placeholder="Select a make"
                        size="large"
                        isDisabled={!scope}
                        loading={catalog.makesLoading}
                        options={catalog.makes}
                        handleChange={() => clearDescendantsOf('make')}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInputWithSearch
                        name="model"
                        label="Model"
                        placeholder="Select a model"
                        size="large"
                        isDisabled={!values.make}
                        loading={catalog.modelsLoading}
                        options={catalog.models}
                        handleChange={() => clearDescendantsOf('model')}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInputWithSearch
                        name="manufacturingYear"
                        label="Manufacturing year"
                        placeholder="Select a year"
                        size="large"
                        isDisabled={!values.model}
                        loading={catalog.yearsLoading}
                        options={catalog.years}
                        handleChange={() => clearDescendantsOf('year')}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInputWithSearch
                        name="variant"
                        label="Trim/Variant"
                        placeholder="Select a variant"
                        size="large"
                        isDisabled={!values.manufacturingYear}
                        loading={catalog.trimsLoading}
                        options={catalog.trims}
                    />
                </Col>
                {!!children && (
                    <Col xs={24} md={12}>
                        {children}
                    </Col>
                )}
            </Row>
        </ReportSectionCard>
    );
};

export default VehicleInformationSection;
