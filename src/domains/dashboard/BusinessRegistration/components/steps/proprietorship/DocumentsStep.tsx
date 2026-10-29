import { useEffect, useState } from 'react';

import { Col, Row, Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import DirectorDocuments from './DirectorDocuments';
import { getDocumentChecklist, getServiceDocuments } from '../../../api';
import { EntityType } from '../../../types';
import {
    getAllDocNames,
    getDocPeopleGroup,
    serviceDocFields,
    setRoleChecklist,
    setServiceDocuments,
    singlePersonLabel,
} from '../../../utils/proprietorDocuments';
import FileUploadField from '../../FileUploadField';

const { Title, Paragraph, Text } = Typography;

// Documents step, shared by all entities (Figma 1819:22349). Multi-person
// entities (Private Limited, Partnership) upload one KYC set per person.
// The per-person field list comes from the vendor's per-ROLE checklist —
// fetched once here (all directors share it), default list until it lands.
const DocumentsStep = () => {
    const { values } = useFormikContext<Record<string, unknown>>();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [, setListsLoaded] = useState(0);
    const isProprietorship = values.entityType === EntityType.PROPRIETORSHIP;

    useEffect(() => {
        const auth = { userId: Number(userId), userType: userType ?? '' };
        getDocumentChecklist({ ...auth, role: 'director' }).then(res => {
            if (res && typeof res === 'object' && Array.isArray(res.documents)) {
                setRoleChecklist('director', res.documents);
                setListsLoaded(c => c + 1);
            }
        });
        getServiceDocuments({ ...auth, entityType: String(values.entityType ?? '') }).then(res => {
            if (res && typeof res === 'object' && Array.isArray(res.documents)) {
                setServiceDocuments(res.documents);
                setListsLoaded(c => c + 1);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const docNames = getAllDocNames(values);
    const uploaded = docNames.filter(name => getIn(values, name)).length;
    const total = docNames.length;
    const pct = total ? Math.round((uploaded / total) * 100) : 0;
    const personLabel = getDocPeopleGroup(values)?.label ?? singlePersonLabel(values);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title
                    level={3}
                    className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]"
                >
                    Documents
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    {isProprietorship
                        ? 'Upload your business documents'
                        : 'Upload identity, address and PAN proofs'}
                </Paragraph>
            </div>

            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-6">
                {/* Upload progress */}
                <div className="bg-[#f8f8f8] rounded-[12px] p-4 flex flex-col gap-2">
                    {/* Wraps on a phone: the heading plus "n of m documents uploaded" is
                            wider than a 320px screen once both cards' padding is taken off. */}
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <Text className="!text-[15px] !font-semibold !text-[#1e293b]">
                            Upload Progress
                        </Text>
                        <Text className="!text-[14px] !text-[#ff4f4f]">
                            {uploaded} of {total} documents uploaded
                        </Text>
                    </div>
                    <div className="h-[6px] w-full rounded-full bg-[#e5e7eb]">
                        <div
                            className="h-full rounded-full bg-[#ff4f4f] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {/* Business documents — vendor-driven per entity (smartservice=1) */}
                <div className="flex flex-col gap-3">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">
                        Business Documents
                    </Text>
                    <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6">
                        <Row gutter={[16, 16]}>
                            {serviceDocFields().map(doc => (
                                <Col xs={24} md={12} key={doc.name}>
                                    <FileUploadField
                                        name={doc.name}
                                        label={doc.label}
                                        required={doc.required}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>

                {/* Director KYC Documents — not collected for proprietorship. */}
                {!isProprietorship && (
                    <div className="flex flex-col gap-3">
                        <Text className="!text-[16px] !font-semibold !text-[#1e293b]">
                            {personLabel} KYC Documents
                        </Text>
                        <DirectorDocuments />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentsStep;
