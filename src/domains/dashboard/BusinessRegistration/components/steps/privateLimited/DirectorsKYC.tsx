import { useEffect } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';

import { EntityType } from '../../../types';
import { EMPTY_PERSON } from '../../../utils/person';
import { numberRangeOptions, PVT_DIRECTOR_LIMITS } from '../../../utils/proprietorKyc';
import FieldError from '../../FieldError';
import CollapsiblePersonCard from '../CollapsiblePersonCard';
import ImportantRequirements from '../ImportantRequirements';
import RegisteredOfficeSection from '../RegisteredOfficeSection';
import SaveProgressNote from '../SaveProgressNote';

const { Title, Paragraph, Text } = Typography;

interface DirectorsValues {
    numberOfDirectors?: number | string;
    directors?: unknown[];
    documents?: { directors?: unknown[] };
}

// Keeps the director cards in sync with the "Number of Directors" chosen in the
// Structure section (step 1) — grows with empty cards, trims from the end.
// Uploaded documents are index-aligned with the directors array, so trimming
// directors also trims documents.directors to keep the person↔docs mapping true.
const SyncDirectorsWithCount = () => {
    const { values, setFieldValue } = useFormikContext<DirectorsValues>();
    const target = Number(values.numberOfDirectors) || 0;

    useEffect(() => {
        if (!target) return;
        const current = values.directors || [];
        if (current.length === target) return;
        const next =
            current.length < target
                ? [
                      ...current,
                      ...Array.from({ length: target - current.length }, () => ({ ...EMPTY_PERSON })),
                  ]
                : current.slice(0, target);
        setFieldValue('directors', next);
        const docs = values.documents?.directors;
        if (current.length > target && (docs?.length ?? 0) > target) {
            setFieldValue('documents.directors', docs!.slice(0, target));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    return null;
};

// Multi-director KYC via a FieldArray (Figma 1854:34644 / 1854:38909). Shared by
// Private Limited (2-15 directors, Companies Act) and LLP (min 2 designated
// partners) — heading and limits differ. RM sidebar comes from the shell.
const DirectorsKYC = ({ title = 'Promoters KYC' }: { title?: string }) => {
    const { values, setFieldValue } = useFormikContext<
        { entityType?: EntityType } & DirectorsValues
    >();
    const isPvt = values.entityType === EntityType.PRIVATE_LIMITED;
    const isLlp = values.entityType === EntityType.LLP;
    const limits = isPvt ? PVT_DIRECTOR_LIMITS : { min: 2, max: 10 };
    // Private Limited uses one "Promoters" list (Director / Shareholder /
    // Representative); LLP uses "Partner" (designation chosen per person).
    let personWord = 'Director';
    if (isPvt) personWord = 'Promoter';
    else if (isLlp) personWord = 'Partner';

    // The count is chosen here (removed from Basic Info) — seed fresh drafts
    // with the entity minimum so the cards match from the start. Resumed drafts
    // keep their saved count.
    const hasCount = Boolean(Number(values.numberOfDirectors));
    useEffect(() => {
        if (!hasCount) setFieldValue('numberOfDirectors', limits.min);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasCount]);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title level={3} className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]">
                    {title}
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    Identity, PAN and DSC/DIN details
                </Paragraph>
            </div>

            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-6">
                <SyncDirectorsWithCount />
                <SaveProgressNote />
                <SelectInput
                    label={`Number of ${personWord}s* (${limits.min}-${limits.max})`}
                    name="numberOfDirectors"
                    options={numberRangeOptions(limits.min, limits.max)}
                    placeholder="Select Number"
                    size="large"
                />

                <FieldArray name="directors">
                    {({ push, remove, form }) => {
                        const directors = (form.values.directors as unknown[]) || [];
                        return (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">
                                        {personWord} Details
                                    </Text>
                                    <Button
                                        icon={<PlusOutlined />}
                                        disabled={directors.length >= limits.max}
                                        onClick={() => {
                                            push({ ...EMPTY_PERSON });
                                            // Keep the count select in sync so a resumed
                                            // draft never trims manually added cards.
                                            form.setFieldValue('numberOfDirectors', directors.length + 1);
                                        }}
                                        className="!h-[36px] !text-[14px] !font-medium !rounded-[8px] !border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] transition-colors"
                                    >
                                        Add {personWord}
                                    </Button>
                                </div>
                                {directors.map((_, i) => (
                                    <CollapsiblePersonCard
                                        key={i}
                                        label={personWord}
                                        index={i}
                                        namePrefix="directors"
                                        canRemove={directors.length > 1}
                                        onRemove={() => {
                                            remove(i);
                                            form.setFieldValue('numberOfDirectors', directors.length - 1);
                                            // Keep uploaded docs aligned with the person indexes.
                                            const docs = (form.values.documents as { directors?: unknown[] } | undefined)?.directors;
                                            if (docs?.length) {
                                                form.setFieldValue(
                                                    'documents.directors',
                                                    docs.filter((_doc, di) => di !== i)
                                                );
                                            }
                                        }}
                                    />
                                ))}
                                <FieldError name="directors" />
                            </div>
                        );
                    }}
                </FieldArray>

                {/* Registered office — post-payment (moved from Basic Information, 23-07) */}
                <RegisteredOfficeSection />

                <ImportantRequirements />
            </div>
        </div>
    );
};

export default DirectorsKYC;
