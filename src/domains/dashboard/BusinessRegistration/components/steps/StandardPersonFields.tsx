import { Col } from 'antd';
import { getIn, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import DinField from './DinField';
import PersonAddressFields from './PersonAddressFields';
import PersonIdentityFields from './PersonIdentityFields';
import VideoKycNote from './VideoKycNote';
import { isDesignatedPartnerRole, isDirectorRole } from '../../utils/proprietorKyc';

// Full person KYC field set (identity fields + DIN/Email/Mobile + residential
// address + Video KYC note). Shared by promoter and nominee cards. `limitAddress`
// keeps the 25-char address-line cap (nominee only). DIN shows only for director
// roles — a pure Shareholder / Representative isn't a director.
const StandardPersonFields = ({
    namePrefix,
    limitAddress = false,
    indianOnly = false,
}: {
    namePrefix: string;
    limitAddress?: boolean;
    indianOnly?: boolean;
}) => {
    const { values } = useFormikContext<Record<string, unknown>>();
    const n = (field: string) => `${namePrefix}.${field}`;
    const foreign = !indianOnly && getIn(values, n('nationality')) === 'foreign';
    const role = String(getIn(values, n('promoterType')) ?? '');
    // Empty role = legacy/default director; pure shareholder/representative = no DIN.
    // LLP: only Designated Partners carry a DIN/DPIN.
    const showDin = !role || isDirectorRole(role) || isDesignatedPartnerRole(role);
    return (
        <>
            <PersonIdentityFields namePrefix={namePrefix} indianOnly={indianOnly}>
                {showDin && (
                    <Col xs={24} md={12}>
                        <DinField namePrefix={namePrefix} />
                    </Col>
                )}
                <Col xs={24} md={12}>
                    <TextInput label="Email address" name={n('email')} type="text" placeholder="Enter email" isRequired size="large" />
                </Col>
                <Col xs={24} md={4}>
                    <TextInput label="ISD code" name={n('isdCode')} type="text" placeholder="91" maxLength={4} allowNumbersOnly size="large" />
                </Col>
                <Col xs={24} md={8}>
                    <TextInput label="Mobile" name={n('mobile')} type="text" placeholder={foreign ? 'Mobile number' : '000 00 000'} maxLength={foreign ? 15 : 10} allowNumbersOnly isRequired size="large" />
                </Col>
            </PersonIdentityFields>
            <PersonAddressFields namePrefix={namePrefix} limitLines={limitAddress} />
            <VideoKycNote />
        </>
    );
};

export default StandardPersonFields;
