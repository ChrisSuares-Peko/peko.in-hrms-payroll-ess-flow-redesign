import { ReactNode, useEffect } from 'react';

import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import { getIn, useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import PanField from './PanField';
import { EntityType } from '../../types';
import { COUNTRIES } from '../../utils/countries';
import { INDIA_STATES } from '../../utils/data';
import {
    GENDER_OPTIONS,
    LLP_DESIGNATION_OPTIONS,
    NATIONALITY_OPTIONS,
    OCCUPATION_OPTIONS,
    PROMOTER_TYPE_OPTIONS,
    QUALIFICATION_OPTIONS,
    SALUTATION_OPTIONS,
} from '../../utils/proprietorKyc';

interface PersonIdentityFieldsProps {
    namePrefix: string;
    // Entity-specific trailing fields (e.g. DIN/Profit Share/Email/Mobile) rendered
    // inside the same grid.
    children?: ReactNode;
    // Force the Promoter Type (role) field on/off. Defaults to Private Limited
    // only — the role (Director / Director & Shareholder / Director &
    // Representative) is meaningless for single-member entities (OPC has one
    // natural-person member per Companies Act s.2(62); proprietorship/partnership/
    // LLP have no director-shareholder split). The Add-Shareholder modal has its
    // own Formik without entityType, so it passes this explicitly.
    showPromoterType?: boolean;
    // OPC members are always Indian (Companies Act) — hide the nationality
    // selector, force it to `indian`, and drop the foreign identity branch.
    indianOnly?: boolean;
}

// Shared identity fields for a director/partner/proprietor (Figma 1808/1835).
// Vendor doc §14: PAN is mandatory for an INDIAN person, passport number (with
// citizenship country) for a FOREIGN one — the identity proof swaps by nationality.
const PersonIdentityFields = ({ namePrefix, children, showPromoterType, indianOnly }: PersonIdentityFieldsProps) => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const n = (field: string) => `${namePrefix}.${field}`;
    const foreign = !indianOnly && getIn(values, n('nationality')) === 'foreign';
    const entity = (values as { entityType?: string }).entityType;
    const isLlp = entity === EntityType.LLP;
    // Private Limited shows a Promoter Type; LLP shows a partner Designation.
    const showRole = showPromoterType ?? (entity === EntityType.PRIVATE_LIMITED || isLlp);
    // Indian-only entities (OPC) have no nationality choice — lock the value so
    // validation and the vendor payload get `indian`.
    useEffect(() => {
        if (indianOnly && getIn(values, n('nationality')) !== 'indian') {
            setFieldValue(n('nationality'), 'indian');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [indianOnly]);
    return (
        <>
            {!indianOnly && (
                <SelectInput label="Nationality" name={n('nationality')} options={NATIONALITY_OPTIONS} placeholder="Select nationality" isRequired size="large" />
            )}
            <Row gutter={[16, 0]}>
                {foreign ? (
                    <>
                        <Col xs={24} md={12}>
                            <TextInput label="Passport Number" name={n('passportNumber')} type="text" placeholder="Enter passport number" isRequired size="large" />
                        </Col>
                        <Col xs={24} md={12}>
                            <SelectInput label="Country of Citizenship" name={n('citizenship')} options={COUNTRIES} placeholder="Select country" showSearch isRequired size="large" />
                        </Col>
                    </>
                ) : (
                    <Col xs={24} md={12}>
                        <PanField namePrefix={namePrefix} />
                    </Col>
                )}
                {showRole && (
                    <Col xs={24} md={12}>
                        <SelectInput
                            label={isLlp ? 'Designation' : 'Promoter Type'}
                            name={n('promoterType')}
                            options={isLlp ? LLP_DESIGNATION_OPTIONS : PROMOTER_TYPE_OPTIONS}
                            placeholder={isLlp ? 'Select designation' : 'Select promoter type'}
                            size="large"
                        />
                    </Col>
                )}
                <Col xs={24} md={12}>
                    <TextInput label="First Name" name={n('firstName')} type="text" placeholder="Enter first name" isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="Middle Name" name={n('middleName')} type="text" placeholder="Enter middle name" size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="Last Name" name={n('lastName')} type="text" placeholder="Enter last name" isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInput label="Salutation" name={n('salutation')} options={SALUTATION_OPTIONS} placeholder="Select" isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="Full Name" name={n('fullName')} type="text" placeholder="Auto fill" isDisabled size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="Father's Name" name={n('fathersName')} type="text" placeholder="Enter father's name" isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    {/* Must be 18+ — cap the picker at today−18y (later dates
                        disabled) and open it at that month/year. */}
                    <DatePickerInput label="Date of Birth" name={n('dob')} placeholder="Select date" maxDate={dayjs().subtract(18, 'year')} isRequired size="large" />
                </Col>
                {/* Place of birth (vendor: birth_place = state, birth_district = district).
                    Indian nationals pick the state from the list; foreign nationals type it.
                    District/town is free text — the vendor has no district master (query #2). */}
                <Col xs={24} md={12}>
                    {foreign ? (
                        <TextInput label="Birth Place (State/Province)" name={n('birthPlace')} type="text" placeholder="Enter state / province of birth" isRequired size="large" />
                    ) : (
                        <SelectInput label="Birth Place (State)" name={n('birthPlace')} options={INDIA_STATES} placeholder="Select state of birth" showSearch isRequired size="large" />
                    )}
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="Birth Place (District/City)" name={n('birthDistrict')} type="text" placeholder="Enter district / city of birth" isRequired size="large" />
                </Col>
                {/* Vendor enums (§14.2) — free text risks vendor-side rejection.
                    Required: the vendor's people API rejects the director when
                    any of these is missing. */}
                <Col xs={24} md={12}>
                    <SelectInput label="Qualification" name={n('qualification')} options={QUALIFICATION_OPTIONS} placeholder="Select qualification" isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInput label="Occupation" name={n('occupation')} options={OCCUPATION_OPTIONS} placeholder="Select occupation" isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInput label="Gender" name={n('gender')} options={GENDER_OPTIONS} placeholder="Select gender" isRequired size="large" />
                </Col>
                {children}
            </Row>
        </>
    );
};

export default PersonIdentityFields;
