import { PlusOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { FieldArray } from 'formik';

import { EMPTY_PARTNER } from '../../../utils/partnership';
import { KYC_SUBTITLE, KYC_TITLE } from '../../../utils/proprietorKyc';
import FieldError from '../../FieldError';
import ImportantRequirements from '../ImportantRequirements';
import RegisteredOfficeSection from '../RegisteredOfficeSection';
import SaveProgressNote from '../SaveProgressNote';
import PartnerCard from './PartnerCard';

const { Title, Paragraph, Text } = Typography;

interface PartnerValue {
    [key: string]: unknown;
}

// Step 2 of the Partnership registration form (Figma 1835:23412) — one or more
// partners via a FieldArray. RM sidebar is provided by the form shell.
const PartnersKYC = () => (
    <div className="flex flex-col gap-4">
        <div>
            <Title level={3} className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]">
                {KYC_TITLE}
            </Title>
            <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                {KYC_SUBTITLE}
            </Paragraph>
        </div>

        <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-6">
            <SaveProgressNote />
            <FieldArray name="partners">
                {({ push, remove, form }) => {
                    const partners = (form.values.partners as PartnerValue[]) || [];
                    return (
                        <>
                            <div className="flex items-center justify-between">
                                <Text className="!text-[16px] !font-semibold !text-[#1e293b]">
                                    Partner Details
                                </Text>
                                <Button
                                    icon={<PlusOutlined />}
                                    disabled={partners.length >= 50}
                                    onClick={() => push({ ...EMPTY_PARTNER })}
                                    className="!h-[36px] !text-[14px] !font-medium !rounded-[8px] !border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] transition-colors"
                                >
                                    Add Partner
                                </Button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {partners.map((_, i) => (
                                    <PartnerCard
                                        key={i}
                                        index={i}
                                        canRemove={partners.length > 1}
                                        onRemove={() => {
                                            remove(i);
                                            // Uploaded docs are index-aligned with partners.
                                            const docs = (form.values.documents as { partners?: unknown[] } | undefined)?.partners;
                                            if (docs?.length) {
                                                form.setFieldValue(
                                                    'documents.partners',
                                                    docs.filter((_doc, di) => di !== i)
                                                );
                                            }
                                        }}
                                    />
                                ))}
                                <FieldError name="partners" />
                            </div>
                        </>
                    );
                }}
            </FieldArray>

            {/* Registered office — post-payment (moved from Basic Information, 23-07) */}
            <RegisteredOfficeSection />

            <ImportantRequirements />
        </div>
    </div>
);

export default PartnersKYC;
