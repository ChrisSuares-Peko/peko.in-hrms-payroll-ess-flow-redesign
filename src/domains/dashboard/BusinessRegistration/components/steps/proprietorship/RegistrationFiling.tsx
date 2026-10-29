import { Fragment } from 'react';

import { Checkbox, Typography } from 'antd';
import { useField, useFormikContext } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import { EntityType } from '../../../types';
import { ENTITY_SHORT_LABELS } from '../../../utils/data';
import { formatINR } from '../../../utils/opc';
import { shareholdingTotal } from '../../../utils/person';

const { Title, Paragraph, Text } = Typography;

const CONFIRM_TEXT =
    'I have reviewed and confirm that all the above details are accurate. I understand that incorrect information may lead to rejection by the MCA and re-filing of the application.';

type Person = { firstName?: string; middleName?: string; lastName?: string };

const personName = (p?: Person) =>
    [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(' ') || '--';

// Every person entered, labelled by their role for the entity type — so the
// user can review who's on the application before filing.
const peopleRows = (
    entityType: EntityType | undefined,
    v: Record<string, unknown>
): [string, string][] => {
    const arr = (key: string) => (v[key] as Person[] | undefined) || [];
    if (entityType === EntityType.PRIVATE_LIMITED) {
        return arr('directors').map((d, i): [string, string] => [
            `Promoter ${i + 1}`,
            personName(d),
        ]);
    }
    if (entityType === EntityType.OPC) {
        return [
            ['Director', personName(v.director as Person)],
            ['Nominee', personName(v.nominee as Person)],
        ];
    }
    if (entityType === EntityType.PARTNERSHIP) {
        return arr('partners').map((p, i): [string, string] => [`Partner ${i + 1}`, personName(p)]);
    }
    if (entityType === EntityType.LLP) {
        return arr('directors').map((d, i): [string, string] => [
            `Designated Partner ${i + 1}`,
            personName(d),
        ]);
    }
    // Proprietorship's owner is the GST authorised person (Applicant Details step),
    // not a director object.
    const gst = v.gst as { salutation?: string; authorizedPerson?: string } | undefined;
    const proprietor = [gst?.salutation, gst?.authorizedPerson].filter(Boolean).join(' ') || '--';
    return [['Proprietor', proprietor]];
};

const peopleSectionTitle = (entityType: EntityType | undefined): string => {
    if (entityType === EntityType.PROPRIETORSHIP) return 'Proprietor';
    if (entityType === EntityType.PARTNERSHIP) return 'Partners';
    return 'Directors / Partners';
};

// Final review step — mirrors the details the user entered so they can verify
// everything before the smart form is filed with the MCA.
const RegistrationFiling = () => {
    const { values } = useFormikContext<Record<string, unknown>>();
    const { currentApplication } = useAppSelector(state => state.reducer.businessRegistration);
    const [confirm, , confirmHelpers] = useField('filingConfirmed');

    const entityType = values.entityType as EntityType | undefined;
    const proposed = (values.proposedNames as { first?: string } | undefined)?.first;
    const office = values.registeredOfficeAddress as
        | { line1?: string; city?: string; state?: string }
        | undefined;
    const officeText =
        [office?.line1, office?.city, office?.state].filter(Boolean).join(', ') ||
        (values.registeredOffice === 'have' ? 'Own registered office' : '--');

    const faceValue = Number(values.faceValuePerShare) || 0;
    const authorized = Number(values.authorizedCapital) || 0;
    // Paid-up capital is entered explicitly now; fall back to the allotted total
    // (they're equal once validation passes) for older drafts without the field.
    const paidUp = Number(values.paidUpCapital) || shareholdingTotal(values) * faceValue;

    const hasShares = entityType === EntityType.OPC || entityType === EntityType.PRIVATE_LIMITED;
    const isLlp = entityType === EntityType.LLP;
    // Proprietorship has no incorporation state — show its GST Applying State instead.
    const isProp = entityType === EntityType.PROPRIETORSHIP;
    let stateRowLabel = 'State of Incorporation';
    if (isProp) stateRowLabel = 'GST Applying State';
    else if (entityType === EntityType.PARTNERSHIP) stateRowLabel = 'State of Registration';
    const stateRowValue =
        (isProp
            ? (values.gst as { state?: string } | undefined)?.state
            : (values.stateOfIncorporation as string)) || '--';

    const basicsRows: [string, string][] = [
        ['Entity Type', entityType ? ENTITY_SHORT_LABELS[entityType] : '--'],
        ['Proposed Name (1st choice)', proposed || '--'],
        [stateRowLabel, stateRowValue],
    ];
    if (isProp) {
        // No registered office / pre-filing activity for proprietorship — show the
        // GST Principal Place of Business (activity is captured vendor-side later).
        const gst = values.gst as
            | { address?: string; district?: string; pincode?: string }
            | undefined;
        const ppob = [gst?.address, gst?.district, gst?.pincode].filter(Boolean).join(', ') || '--';
        basicsRows.push(['Principal Place of Business', ppob]);
    } else {
        basicsRows.push(['Registered Office', officeText]);
        basicsRows.push(['Business Activity', (values.businessDescription as string) || '--']);
    }

    const sections: { title: string; rows: [string, string][] }[] = [
        {
            title: isProp ? 'Business Basics' : 'Company Basics',
            rows: basicsRows,
        },
        ...(hasShares
            ? [
                  {
                      title: 'Capital',
                      rows: [
                          ['Authorized Capital', formatINR(authorized)],
                          ['Paid-up Capital', formatINR(paidUp)],
                          ['Face Value / Share', formatINR(faceValue)],
                      ] as [string, string][],
                  },
              ]
            : []),
        ...(isLlp
            ? [
                  {
                      title: 'Contribution',
                      rows: [
                          ['Total Contribution', formatINR(Number(values.totalContribution) || 0)],
                      ] as [string, string][],
                  },
              ]
            : []),
        {
            title: peopleSectionTitle(entityType),
            rows: peopleRows(entityType, values),
        },
        {
            title: 'References',
            rows: [['Application ID', (currentApplication?.applicationId as string) || '--']],
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title
                    level={3}
                    className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]"
                >
                    Registration &amp; Filing
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    Submit the registration and track status
                </Paragraph>
            </div>

            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-4">
                <div>
                    <Text className="!block !text-[18px] !font-semibold !text-[#1e293b] !mb-1">
                        Ready to file with MCA
                    </Text>
                    <Text className="!text-[13px] !text-[#6a7282] !leading-[20px]">
                        We have verified your details and documents. Filing the smart form submits
                        your application to the Ministry of Corporate Affairs and generates an SRN.
                    </Text>
                </div>

                <div className="border border-[#ebebeb] rounded-[12px] overflow-hidden">
                    {sections.map(section => (
                        <Fragment key={section.title}>
                            <div className="bg-[#f8f8f8] px-4 py-2 text-[12px] font-semibold uppercase text-[#64748b] tracking-wide">
                                {section.title}
                            </div>
                            {section.rows.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex border-t border-[#ebebeb] px-4 py-3"
                                >
                                    <div className="w-[45%] text-[14px] text-[#475569]">
                                        {label}
                                    </div>
                                    <div className="flex-1 text-[14px] text-[#1e293b] font-medium break-words">
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </Fragment>
                    ))}
                </div>

                <div className="bg-[#f8f8f8] rounded-[8px] px-4 py-3">
                    <Checkbox
                        checked={Boolean(confirm.value)}
                        onChange={e => confirmHelpers.setValue(e.target.checked)}
                    >
                        <span className="text-[13px] text-[#1e293b] leading-[20px]">
                            {CONFIRM_TEXT}
                        </span>
                    </Checkbox>
                </div>
            </div>
        </div>
    );
};

export default RegistrationFiling;
