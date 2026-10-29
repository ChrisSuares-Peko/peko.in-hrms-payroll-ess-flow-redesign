import { useEffect } from 'react';

import { Col, Form, Row } from 'antd';
import { useFormikContext } from 'formik';

import MultiSelectInput from '@components/atomic/inputs/MultiSelectInput';
import SelectInput from '@components/atomic/inputs/SelectInput';

import IecFreeTextTagsInput from './IecFreeTextTagsInput';
import { VendorBusiness } from '../../apis';
import { IecApplicantDetailsValues } from '../../types';
import { PREFERRED_SECTOR_OPTIONS, SALUTATION_OPTIONS } from '../../utils/iecForm';
import { ENTITY_TYPE_OPTIONS } from '../../utils/serviceDetailForm';
import VendorDirectorSelect from '../vendorDirector/VendorDirectorSelect';

const authorizedPersonPlaceholder = (hasBusinessSelected: boolean, isLoadingDirectors: boolean): string => {
    if (!hasBusinessSelected) return 'Select a business first';
    if (isLoadingDirectors) return 'Loading directors…';
    return 'Select the authorized person';
};

interface IecApplicationDetailsStepProps {
    businessOptions: { label: string; value: string }[];
    businesses: VendorBusiness[];
    isLoadingBusinesses: boolean;
    // Doc "Dropdowns API" (service_id=11/operation=iec_details) — the same combined goods+services
    // list behind both Import Details and Export Details, fetched live by useIecApplicationData.ts.
    importExportOptions: { label: string; value: string }[];
    isLoadingImportExportOptions: boolean;
    // Common vendorDirector/VendorDirectorSelect field — same "Authorized Person" picker FSSAI uses,
    // instead of IEC's own bespoke search modal.
    directorOptions: { label: string; value: string }[];
    isLoadingDirectors: boolean;
    onSelectBusiness: (business: VendorBusiness | undefined) => void;
    onSelectDirector: (directorId: string) => void;
    onAddDirector: () => void;
}

// Step 1 (doc §3/§4): Preferred Sectors drives which detail block shows — Import/Export/Others
// Details only render while their own chip is selected, and clear (via onSectorsChange) the
// moment a chip is removed so a deselected sector's stale values are never saved (doc §9.2).
const IecApplicationDetailsStep = ({
    businessOptions,
    businesses,
    isLoadingBusinesses,
    importExportOptions,
    isLoadingImportExportOptions,
    directorOptions,
    isLoadingDirectors,
    onSelectBusiness,
    onSelectDirector,
    onAddDirector,
}: IecApplicationDetailsStepProps) => {
    const { values, setFieldValue } = useFormikContext<IecApplicantDetailsValues>();

    const handleBusinessChange = (value: string) => {
        const business = businesses.find((b) => String(b.application_id) === value);
        onSelectBusiness(business);
    };

    // Doc §9.2 "Sector deselected" — hides and clears the matching detail field immediately
    // rather than only hiding it, so a re-added chip always starts from empty (doc §5 Step 3).
    useEffect(() => {
        if (!values.preferredSectors.includes('Import') && values.importDetails.length > 0) {
            setFieldValue('importDetails', []);
        }
        if (!values.preferredSectors.includes('Export') && values.exportDetails.length > 0) {
            setFieldValue('exportDetails', []);
        }
        if (!values.preferredSectors.includes('Others') && values.othersDetails.length > 0) {
            setFieldValue('othersDetails', []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.preferredSectors]);

    return (
        <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
            <Row gutter={[16, 8]}>
                <Col xs={24} sm={12}>
                    {/* Same mechanism as Trademark Registration's own "Trademark Owner" dropdown
                        (ApplicantDetailsStep.tsx) — picking a business prefills Entity Type and the
                        business name shown in the preview, via onSelectBusiness in the parent page. */}
                    <SelectInput
                        name="businessApplicationId"
                        label="Business"
                        placeholder={isLoadingBusinesses ? 'Loading businesses…' : 'Select the business'}
                        classes="h-10"
                        isRequired
                        isDisabled={isLoadingBusinesses}
                        showSearch
                        options={businessOptions}
                        handleChange={handleBusinessChange}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="entityType"
                        label="Entity Type"
                        placeholder="Select the entity type"
                        classes="h-10"
                        isRequired
                        showSearch
                        options={ENTITY_TYPE_OPTIONS}
                    />
                </Col>
            </Row>

            <Row gutter={[16, 8]}>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="salutation"
                        label="Salutation"
                        placeholder="Select"
                        classes="h-10"
                        isRequired
                        options={SALUTATION_OPTIONS}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <VendorDirectorSelect
                        name="authorizedPersonId"
                        label="Authorized Person"
                        placeholder={authorizedPersonPlaceholder(Boolean(values.businessApplicationId), isLoadingDirectors)}
                        isDisabled={!values.businessApplicationId || isLoadingDirectors}
                        options={directorOptions}
                        onSelectDirector={onSelectDirector}
                        onAddDirector={onAddDirector}
                    />
                </Col>
            </Row>

            <Row gutter={[16, 8]}>
                <Col xs={24}>
                    <MultiSelectInput
                        name="preferredSectors"
                        label="Preferred Sectors"
                        placeholder="Select preferred sectors"
                        classes="h-10"
                        isRequired
                        options={PREFERRED_SECTOR_OPTIONS}
                    />
                </Col>
            </Row>

            {values.preferredSectors.includes('Import') && (
                <Row gutter={[16, 8]}>
                    <Col xs={24}>
                        <MultiSelectInput
                            name="importDetails"
                            label="Import Details"
                            placeholder={isLoadingImportExportOptions ? 'Loading options…' : 'Select import details'}
                            classes="h-10"
                            isRequired
                            options={importExportOptions}
                            filterOption
                        />
                    </Col>
                </Row>
            )}

            {values.preferredSectors.includes('Export') && (
                <Row gutter={[16, 8]}>
                    <Col xs={24}>
                        <MultiSelectInput
                            name="exportDetails"
                            label="Export Details"
                            placeholder={isLoadingImportExportOptions ? 'Loading options…' : 'Select export details'}
                            classes="h-10"
                            isRequired
                            options={importExportOptions}
                            filterOption
                        />
                    </Col>
                </Row>
            )}

            {values.preferredSectors.includes('Others') && (
                <Row gutter={[16, 8]}>
                    <Col xs={24}>
                        <IecFreeTextTagsInput
                            name="othersDetails"
                            label="Others Details"
                            placeholder="Type a detail and press enter"
                            isRequired
                        />
                    </Col>
                </Row>
            )}
        </Form>
    );
};

export default IecApplicationDetailsStep;
