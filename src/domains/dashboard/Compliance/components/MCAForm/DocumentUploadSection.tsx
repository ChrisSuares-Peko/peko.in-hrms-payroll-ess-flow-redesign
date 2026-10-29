import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { MCAFormValues } from './mcaTypes';
import DocUploadField from '../ComplianceDetail/DocUploadField';
import MultiDocUploadField from '../ComplianceShared/MultiDocUploadField';

const { Text } = Typography;

const DocumentUploadSection: React.FC = () => {
    const { values } = useFormikContext<MCAFormValues>();
    const filings = values.mca_selectedFilings;

    const hasADT1 = filings.includes('ADT1');
    const hasAnnual = filings.includes('AOC4') || filings.includes('MGT7');
    const hasDIR3 = filings.includes('DIR3KYC');
    const hasDPT3 = filings.includes('DPT3');
    const hasMSME1 = filings.includes('MSME1');

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Document Upload</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Upload all required documents — PDF, JPG, PNG accepted (max 5 MB each)
                </Text>
            </Flex>

            <Row gutter={[16, 20]}>
                {/* Always required */}
                <Col xs={24} sm={12}>
                    <DocUploadField name="doc_coi" label="Certificate of Incorporation (COI)" />
                </Col>
                <Col xs={24} sm={12}>
                    <MultiDocUploadField name="doc_moaAoa" label="Memorandum & Articles of Association (MOA & AOA)" multiple />
                </Col>

                {/* ADT-1 documents */}
                {hasADT1 && (
                    <>
                        <Col xs={24} sm={12}>
                            <DocUploadField
                                name="doc_adt1_boardResolution"
                                label="Board Resolution — Auditor Appointment"
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <DocUploadField
                                name="doc_adt1_consentLetter"
                                label="Auditor Consent Letter (Form ADT-1)"
                            />
                        </Col>
                    </>
                )}

                {/* Annual filing documents */}
                {hasAnnual && (
                    <>
                        <Col xs={24} sm={12}>
                            <MultiDocUploadField
                                name="doc_financialStatements"
                                label="Financial Statements (Balance Sheet, P&L, Cash Flow)"
                                multiple
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <DocUploadField name="doc_auditorReport" label="Auditor's Report" />
                        </Col>
                        <Col xs={24} sm={12}>
                            <DocUploadField name="doc_directorsReport" label="Directors' Report" />
                        </Col>
                        <Col xs={24} sm={12}>
                            <MultiDocUploadField
                                name="doc_agmNoticeMinutes"
                                label="AGM Notice & Minutes"
                                multiple
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <DocUploadField
                                name="doc_shareholdingPattern"
                                label="Shareholding Pattern"
                            />
                        </Col>
                    </>
                )}

                {/* DIR-3 KYC documents */}
                {hasDIR3 && (
                    <Col xs={24} sm={12}>
                        <MultiDocUploadField
                            name="doc_dir3_directorKyc"
                            label="Director KYC Documents (Aadhaar, PAN, Photo)"
                            multiple
                        />
                    </Col>
                )}

                {/* DPT-3 documents */}
                {hasDPT3 && (
                    <Col xs={24} sm={12}>
                        <MultiDocUploadField
                            name="doc_dpt3_loanAgreements"
                            label="Loan / Deposit Agreements"
                            multiple
                        />
                    </Col>
                )}

                {/* MSME-1 documents */}
                {hasMSME1 && (
                    <Col xs={24} sm={12}>
                        <MultiDocUploadField
                            name="doc_msme_vendorInvoices"
                            label="MSME Vendor Invoices"
                            multiple
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default DocumentUploadSection;
