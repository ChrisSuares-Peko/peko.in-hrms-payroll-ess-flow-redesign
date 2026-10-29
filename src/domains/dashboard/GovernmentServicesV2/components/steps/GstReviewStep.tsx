import { Fragment } from 'react';

import { Typography } from 'antd';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';

import { GstApplicationValues } from '../../types';
import { GST_DOCUMENT_TYPES } from '../../utils/gstForm';

const { Title, Paragraph, Text } = Typography;

const CONFIRM_TEXT =
    'I have reviewed and confirm that all the above details are accurate. I understand that incorrect information may lead to rejection by the government and re-filing of the application.';

// Step 5 — Review & Submit. Pure read-only summary of everything entered on Steps 1-4, gated by a
// filingConfirmed checkbox — mirrors Business Registration > Proprietorship's RegistrationFiling.tsx
// section/row pattern (see PROPRIETORSHIP_FLOW_REFERENCE.md).
const GstReviewStep = ({ values }: { values: GstApplicationValues }) => {
    const goodsAndServices = [...values.hsnItems, ...values.sacItems]
        .map(item => `${item.code}${item.description ? ` — ${item.description}` : ''}`)
        .join(', ');

    const sections: { title: string; rows: [string, string][] }[] = [
        {
            title: 'Applicant Details',
            rows: [
                ['Applicant Type', values.applicantType || '--'],
                ['Business Name', values.businessName || '--'],
                ['PAN', values.pan || '--'],
                ['Mobile Number', values.mobileNumber || '--'],
                ['Email', values.email || '--'],
                ...(values.cin ? [['CIN / LLPIN', values.cin] as [string, string]] : []),
                ...(values.doi ? [['Date of Incorporation', values.doi] as [string, string]] : []),
            ],
        },
        {
            title: 'Authorized Persons',
            rows: values.authorizedPersons.map((person, index): [string, string] => [
                `${person.fullName || `Person ${index + 1}`}${
                    person.key === values.primaryAuthorizedPersonKey ? ' (Primary)' : ''
                }`,
                `${person.relationship || '--'} · ${person.pan || '--'}`,
            ]),
        },
        {
            title: 'Address Details',
            rows: [
                ['Principal Place of Business', values.address || '--'],
                ['GST Applying State', values.gstApplyingState || '--'],
                ['District', values.district || '--'],
                ['Pincode', values.pincode || '--'],
                ['Circle', values.circle || '--'],
                ['Commissionerate', values.commissionerate || '--'],
                ['Division', values.division || '--'],
                ['Range', values.range || '--'],
                ...(values.electricityBoard
                    ? [['Electricity Board', values.electricityBoard] as [string, string]]
                    : []),
                ...(values.caNumber ? [['CA Number', values.caNumber] as [string, string]] : []),
            ],
        },
        {
            title: 'GST Information',
            rows: [
                ['Nature of Business Activity', values.natureOfBusinessActivity.join(', ') || '--'],
                ['Registration Under Rule 14A', values.registrationUnderRule14A || '--'],
                ['Top 5 — Goods & Services', goodsAndServices || '--'],
            ],
        },
        {
            title: 'Documents',
            rows: GST_DOCUMENT_TYPES.map(({ key, label }): [string, string] => [
                label,
                values.documents[key]?.fileName || 'Not uploaded',
            ]),
        },
    ];

    return (
        <div className="flex flex-col gap-4 w-full">
            <div>
                <Title level={4} className="!mb-1">
                    Review &amp; Submit
                </Title>
                <Paragraph className="!mb-0 text-[#8C8C8C]">
                    Please review your GST Registration details before filing
                </Paragraph>
            </div>

            <div className="border border-[#ebebeb] rounded-[12px] overflow-hidden">
                {sections.map(section => (
                    <Fragment key={section.title}>
                        <div className="bg-[#f8f8f8] px-4 py-2 text-[12px] font-semibold uppercase text-[#64748b] tracking-wide">
                            {section.title}
                        </div>
                        {section.rows.map(([label, value]) => (
                            <div key={label} className="flex border-t border-[#ebebeb] px-4 py-3">
                                <div className="w-[45%] text-[14px] text-[#475569]">{label}</div>
                                <div className="flex-1 text-[14px] text-[#1e293b] font-medium break-words">
                                    {value}
                                </div>
                            </div>
                        ))}
                    </Fragment>
                ))}
            </div>

            <div className="bg-[#f8f8f8] rounded-[8px] px-4 py-3">
                <CheckboxInput name="filingConfirmed" isRequired>
                    <Text className="!text-[13px] !text-[#1e293b]">{CONFIRM_TEXT}</Text>
                </CheckboxInput>
            </div>
        </div>
    );
};

export default GstReviewStep;
