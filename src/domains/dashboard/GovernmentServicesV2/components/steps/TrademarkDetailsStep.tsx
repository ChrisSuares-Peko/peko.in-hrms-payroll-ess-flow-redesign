import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Form, Row, Spin } from 'antd';
import dayjs from 'dayjs';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import MultiSelectInput from '@components/atomic/inputs/MultiSelectInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { TrademarkClassDescription } from '../../apis';
import { ApplicantDetailsValues } from '../../types';

// WIPO Nice Classification runs 1–45; doc §24 auto-fills one but the corporate can override it.
const TRADEMARK_CLASS_OPTIONS = Array.from({ length: 45 }, (_, i) => ({
    label: String(i + 1),
    value: String(i + 1),
}));

// Transliteration/Translation fields only apply once a non-English mark language is chosen.
const isNonEnglishLanguage = (language?: string) => Boolean(language) && language !== 'English';

interface TrademarkDetailsStepProps {
    values: ApplicantDetailsValues;
    setFieldValue: (field: string, value: unknown) => void;
    languageOptions: { label: string; value: string }[];
    isSearchingSimilar: boolean;
    onBrandSearch: () => void;
    isSearchingGoodsOrService: boolean;
    onGoodsOrServiceChange: (value: string) => void;
    classDescriptions: TrademarkClassDescription[];
}

// Step 2: Brand, Language, Main Goods/Service (Class + Description), and use-in-commerce details.
const TrademarkDetailsStep = ({
    values,
    setFieldValue,
    languageOptions,
    isSearchingSimilar,
    onBrandSearch,
    isSearchingGoodsOrService,
    onGoodsOrServiceChange,
    classDescriptions,
}: TrademarkDetailsStepProps) => (
    <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
        <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
                <TextInput
                    name="brand"
                    label="Brand to be Trademarked"
                    type="text"
                    classes="h-10"
                    isRequired
                    // No Brand API exists for this integration despite the doc's mention — typed directly.
                    placeholder="Enter the brand name"
                    suffix={
                        <Button
                            type="text"
                            size="small"
                            icon={<SearchOutlined />}
                            loading={isSearchingSimilar}
                            onClick={onBrandSearch}
                            style={{ padding: 0 }}
                        />
                    }
                />
            </Col>
            <Col xs={24} sm={12}>
                <SelectInput
                    name="language"
                    label="Language"
                    placeholder="Select language"
                    classes="h-10"
                    isRequired
                    showSearch
                    options={languageOptions}
                />
            </Col>
            {isNonEnglishLanguage(values.language) && (
                <>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="transliterationOfMark"
                            label="Transliteration of the Mark"
                            type="text"
                            classes="h-10"
                            isRequired
                            placeholder="Enter the transliteration of the mark"
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="translationOfMark"
                            label="Translation of the Mark"
                            type="text"
                            classes="h-10"
                            isRequired
                            placeholder="Enter the translation of the mark"
                        />
                    </Col>
                </>
            )}
            <Col xs={24} sm={12}>
                <TextInput
                    name="mainGoodsOrService"
                    label="Main Goods or Service the Brand Represents"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="e.g., clothing, software development"
                    handleChange={onGoodsOrServiceChange}
                    suffix={
                        isSearchingGoodsOrService ? (
                            <Spin size="small" />
                        ) : (
                            <SearchOutlined style={{ color: '#bfbfbf' }} />
                        )
                    }
                />
            </Col>
            <Col xs={24} sm={12}>
                <SelectInput
                    name="trademarkClass"
                    label="Class"
                    placeholder="Select class"
                    classes="h-10"
                    isRequired
                    showSearch
                    options={TRADEMARK_CLASS_OPTIONS}
                    // Description's options are scoped to the selected class, so changing it clears the selection.
                    handleChange={() => setFieldValue('description', [])}
                />
            </Col>
            <Col xs={24}>
                <MultiSelectInput
                    name="description"
                    label="Description"
                    placeholder="Select descriptions for this class"
                    classes="h-10"
                    isRequired
                    options={classDescriptions
                        .filter((d) => String(d.class) === values.trademarkClass)
                        .map((d) => ({ label: d.description, value: d.description }))}
                />
            </Col>
        </Row>

        <CheckboxInput name="trademarkInUse" isRequired={false}>
            Trademark is in use. I agree to submit a notarized affidavit and evidence for use.
        </CheckboxInput>

        {values.trademarkInUse && (
            // Bound to usedSinceDisplay (not usedSince) — the shared DatePickerInput's single
            // `format` prop drives both display AND the stored value, so binding it directly to
            // usedSince would store DD-MM-YYYY instead of the YYYY-MM-DD the Smart Form payload
            // needs. handleChange mirrors the real value into usedSince on every change instead
            // (see types/index.ts and TrademarkRegistrationForm.tsx's resume-hydration comment).
            <DatePickerInput
                name="usedSinceDisplay"
                label="Used Since"
                placeholder="Select the date first used"
                classes="h-10 w-full"
                isRequired={false}
                maxDate={dayjs()}
                format="DD-MM-YYYY"
                handleChange={(value) => {
                    const display = Array.isArray(value) ? value[0] : value;
                    setFieldValue('usedSince', display ? dayjs(display, 'DD-MM-YYYY').format('YYYY-MM-DD') : '');
                }}
            />
        )}

        <TextInput
            name="associatedMarks"
            label="Associated Marks"
            type="text"
            classes="h-10"
            placeholder="Associated Marks"
        />
    </Form>
);

export default TrademarkDetailsStep;
