import { useEffect } from 'react';

import { Col, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { getIn, useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import GstApplicantPanField from './GstApplicantPanField';
import { GST_SALUTATION_OPTIONS, PREMISES_OPTIONS } from '../../../../utils/gst';

const { Title, Paragraph } = Typography;

// GST Registration Smart Form — Step 1 "Applicant Details" (vendor form service 79
// / form 1, PPOB). Applicant/identity fields are prefilled from the proprietor KYC
// (the GST applicant IS the proprietor); Applicant Type and Relationship are fixed
// for a proprietorship so they're hidden and set statically (BE reads gst.*).
const ApplicantDetails = () => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const proposedName = String(getIn(values, 'proposedNames.first') ?? '');
    const contactEmail = String(getIn(values, 'primaryContact.email') ?? '');
    const contactMobile = String(getIn(values, 'primaryContact.mobile') ?? '');
    const businessName = String(getIn(values, 'gst.businessName') ?? '');

    // Seed empty GST fields from the earlier details; re-keyed on the business name
    // so it re-fills if a post-draft-load reinitialize wipes it (draft.gst has none).
    useEffect(() => {
        const prop = (field: string) => String(getIn(values, `director.${field}`) ?? '');
        const seed = (field: string, val: string) => {
            if (val && !getIn(values, field)) setFieldValue(field, val);
        };
        // Disabled mirror of the proposed name — re-sync, not just seed-when-empty.
        if (proposedName && businessName !== proposedName)
            setFieldValue('gst.businessName', proposedName);
        // Authorized Person is auto-filled from the verified PAN (GstApplicantPanField),
        // never seeded from the contact name — it must match the PAN exactly.
        seed('gst.dob', prop('dob'));
        seed('gst.email', prop('email') || contactEmail);
        seed('gst.mobile', prop('mobile') || contactMobile);
        // Proprietorship is always a Taxpayer filing as the Proprietor — fixed, so
        // the fields are hidden and set here rather than asked.
        if (getIn(values, 'gst.applicantType') !== 'Taxpayer')
            setFieldValue('gst.applicantType', 'Taxpayer');
        if (getIn(values, 'gst.relationship') !== 'Proprietor')
            setFieldValue('gst.relationship', 'Proprietor');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proposedName, businessName, contactEmail, contactMobile]);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title
                    level={3}
                    className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]"
                >
                    Applicant Details
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    Applicant, premises and authorized-person details for GST Registration
                </Paragraph>
            </div>

            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6">
                <Row gutter={[16, 8]}>
                    <Col xs={24} md={12}>
                        <SelectInput
                            label="Nature of possession of premises"
                            name="gst.premises"
                            options={PREMISES_OPTIONS}
                            placeholder="Select"
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput
                            label="Business Name"
                            name="gst.businessName"
                            type="text"
                            placeholder="Business name"
                            isDisabled
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <SelectInput
                            label="Salutation"
                            name="gst.salutation"
                            options={GST_SALUTATION_OPTIONS}
                            placeholder="Select"
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <GstApplicantPanField />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput
                            label="Authorised Person (from PAN)"
                            name="gst.authorizedPerson"
                            type="text"
                            placeholder="Auto-filled from the verified PAN"
                            isDisabled
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <DatePickerInput
                            label="Date of Birth"
                            name="gst.dob"
                            placeholder="Select date"
                            maxDate={dayjs().subtract(18, 'year')}
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput
                            label="Mobile Number"
                            name="gst.mobile"
                            type="text"
                            placeholder="10-digit mobile"
                            maxLength={10}
                            allowNumbersOnly
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput
                            label="Email"
                            name="gst.email"
                            type="text"
                            placeholder="Enter email"
                            isRequired
                            size="large"
                        />
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default ApplicantDetails;
