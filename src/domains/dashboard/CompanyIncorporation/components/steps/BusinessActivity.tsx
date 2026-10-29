import { InfoCircleFilled, AppstoreFilled } from '@ant-design/icons';
import { Flex, Select, Typography } from 'antd';
import { useFormikContext } from 'formik';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import { useNIC } from '../../hooks/useFetchNic';
import { ApplicationPayload } from '../../types';

const { Paragraph, Text } = Typography;

const sectionOptions = [
    { label: 'A - Agriculture, Forestry and Fishing', value: 'A' },
    { label: 'B - Mining and Quarrying', value: 'B' },
    { label: 'C - Manufacturing', value: 'C' },
    { label: 'D - Electricity, Gas, Steam and Air Conditioning Supply', value: 'D' },
    { label: 'E - Water Supply, Sewerage, Waste Management', value: 'E' },
    { label: 'F - Construction', value: 'F' },
    { label: 'G - Wholesale and Retail Trade; Repair of Motor Vehicles', value: 'G' },
    { label: 'H - Transportation and Storage', value: 'H' },
    { label: 'I - Accommodation and Food Service Activities', value: 'I' },
    { label: 'J - Information and Communication', value: 'J' },
    { label: 'K - Financial and Insurance Activities', value: 'K' },
    { label: 'L - Real Estate Activities', value: 'L' },
    { label: 'M - Professional, Scientific and Technical Activities', value: 'M' },
    { label: 'N - Administrative and Support Service Activities', value: 'N' },
    { label: 'O - Public Administration and Defence', value: 'O' },
    { label: 'P - Education', value: 'P' },
    { label: 'Q - Human Health and Social Work Activities', value: 'Q' },
    { label: 'R - Arts, Entertainment and Recreation', value: 'R' },
    { label: 'S - Other Service Activities', value: 'S' },
    { label: 'T - Activities of Households as Employers', value: 'T' },
    { label: 'U - Activities of Extraterritorial Organisations', value: 'U' },
];

const SECTION_DIVISION_RANGES: Record<string, [number, number]> = {
    A: [1, 3],
    B: [5, 9],
    C: [10, 33],
    D: [35, 35],
    E: [36, 39],
    F: [41, 43],
    G: [45, 47],
    H: [49, 53],
    I: [55, 56],
    J: [58, 63],
    K: [64, 66],
    L: [68, 68],
    M: [69, 75],
    N: [77, 82],
    O: [84, 84],
    P: [85, 85],
    Q: [86, 88],
    R: [90, 93],
    S: [94, 96],
    T: [97, 98],
    U: [99, 99],
};

const getLabelFromData = (data: { code: string; description: string }[], value: string) =>
    data.find(item => item.code === value)?.description || value;

const filterDivisionsBySection = (
    allDivisions: { code: string; description: string }[],
    section: string
) => {
    const range = SECTION_DIVISION_RANGES[section];
    if (!range) return allDivisions;
    const [min, max] = range;
    return allDivisions.filter(item => {
        const code = parseInt(item.code, 10);
        return code >= min && code <= max;
    });
};

const selectClass =
    '!h-16 w-full [&_.ant-select-selector]:!h-16 [&_.ant-select-selector]:!py-2 [&_.ant-select-selector]:!rounded-[8px]';

const BusinessActivity = () => {
    const { values, setFieldValue, setValues, errors, touched } = useFormikContext<ApplicationPayload>();

    const ba = values.businessActivity || {
        section: '',
        division: '',
        group: '',
        class: '',
        subclass: '',
        secondaryActivity: '',
        otherActivities: '',
        description: '',
    };
    const { data: allDivisions, loading: divisionLoading } = useNIC();
    const filteredDivisions = ba.section ? filterDivisionsBySection(allDivisions, ba.section) : [];
    const { data: groups, loading: groupLoading } = useNIC(ba.division);
    const { data: classes, loading: classLoading } = useNIC(ba.group);
    const { data: subclasses, loading: subclassLoading } = useNIC(ba.class);
    const baErrors = (errors as any)?.businessActivity;
    const baTouched = (touched as any)?.businessActivity;

    const onSectionChange = (value: string) => {
        setValues(
            {
                ...values,
                businessActivity: {
                    ...values.businessActivity,
                    section: value,
                    division: '',
                    group: '',
                    class: '',
                    subclass: '',
                    description: values.businessActivity?.description ?? '',
                },
            },
            true
        );
    };

    const onDivisionChange = (value: string) => {
        setValues(
            {
                ...values,
                businessActivity: {
                    ...values.businessActivity,
                    section: values.businessActivity?.section ?? '',
                    division: value,
                    group: '',
                    class: '',
                    subclass: '',
                    description: values.businessActivity?.description ?? '',
                },
            },
            true
        );
    };

    const onGroupChange = (value: string) => {
        setValues(
            {
                ...values,
                businessActivity: {
                    ...values.businessActivity,
                    section: values.businessActivity?.section ?? '',
                    division: values.businessActivity?.division ?? '',
                    group: value,
                    class: '',
                    subclass: '',
                    description: values.businessActivity?.description ?? '',
                },
            },
            true
        );
    };

    const onClassChange = (value: string) => {
        setFieldValue('businessActivity.class', value);
        setFieldValue('businessActivity.subclass', '');
    };

    const showSelected = !!ba.subclass;

    const otherActivityLines = (ba.otherActivities || '')
        .split('\n')
        .filter(line => line.trim().length > 0).length;
    const remainingActivities = Math.max(0, 13 - otherActivityLines);
    const isOverActivityLimit = otherActivityLines > 13;

    return (
        <div className="space-y-5">
            {/* Info box */}
            <Flex
                gap={16}
                align="center"
                className="bg-[rgba(37,99,235,0.04)] border border-[rgba(0,0,0,0.04)] rounded-[16px] p-4"
            >
                <InfoCircleFilled
                    className="text-[32px] shrink-0"
                    style={{ color: 'rgba(37,99,235,0.8)' }}
                />
                <Paragraph className="!mb-0 text-[14px] leading-[22px] text-[rgba(37,99,235,0.8)]">
                    NIC codes are organized in 5 hierarchical levels: Section → Division → Group →
                    Class → Sub-class. Select each level to specify your exact business activity.
                </Paragraph>
            </Flex>

            {/* Primary Activity */}
            <div className="border-[0.37px] border-zinc-200 rounded-[24px] p-6 space-y-6">
                {/* 1. Section */}
                <div className="space-y-3">
                    <Paragraph className="!mb-0 text-[18px] font-semibold text-textNearBlack">
                        1. Section (Broad Category)
                    </Paragraph>
                    <Select
                        placeholder="Select Primary Activity"
                        value={ba.section || undefined}
                        onChange={onSectionChange}
                        options={sectionOptions}
                        className={selectClass}
                        status={baTouched?.section && baErrors?.section ? 'error' : ''}
                    />
                    {baTouched?.section && baErrors?.section && (
                        <Text data-form-error="true" className="text-errorTextRed text-[12px] block">{baErrors.section}</Text>
                    )}
                </div>

                {/* Nested in grey box */}
                <div className="bg-[#f8f8f8] rounded-[24px] p-6 space-y-6">
                    {/* 2. Division */}
                    <div className="space-y-3">
                        <Paragraph className="!mb-0 text-[18px] font-medium text-textNearBlack">
                            2. Division (2-digit code)
                        </Paragraph>
                        <Select
                            placeholder="Select Activity"
                            value={ba.division || undefined}
                            onChange={onDivisionChange}
                            options={filteredDivisions.map(item => ({
                                label: `${item.code} - ${item.description}`,
                                value: item.code,
                            }))}
                            loading={divisionLoading}
                            disabled={!ba.section}
                            className={`${selectClass} [&_.ant-select-selector]:!bg-white`}
                            status={baTouched?.division && baErrors?.division ? 'error' : ''}
                        />
                        {baTouched?.division && baErrors?.division && (
                            <Text data-form-error="true" className="text-errorTextRed text-[12px] block">
                                {baErrors.division}
                            </Text>
                        )}
                    </div>

                    {/* 3. Group */}
                    <div className="space-y-3">
                        <Paragraph className="!mb-0 text-[18px] font-medium text-textNearBlack">
                            3. Group (3-digit code)
                        </Paragraph>
                        <Select
                            placeholder="Select Activity"
                            value={ba.group || undefined}
                            onChange={onGroupChange}
                            options={groups.map(item => ({
                                label: `${item.code} - ${item.description}`,
                                value: item.code,
                            }))}
                            loading={groupLoading}
                            disabled={!ba.division}
                            className={`${selectClass} [&_.ant-select-selector]:!bg-white`}
                            status={baTouched?.group && baErrors?.group ? 'error' : ''}
                        />
                        {baTouched?.group && baErrors?.group && (
                            <Text data-form-error="true" className="text-errorTextRed text-[12px] block">
                                {baErrors.group}
                            </Text>
                        )}
                    </div>

                    {/* 4. Class (Optional) */}
                    <div className="space-y-3">
                        <Paragraph className="!mb-0 text-[18px] font-medium text-textNearBlack">
                            4. Class (4-digit code){' '}
                            <Text className="font-normal text-slate-500">(Optional)</Text>
                        </Paragraph>
                        <Select
                            placeholder="Select Activity"
                            value={ba.class || undefined}
                            onChange={onClassChange}
                            options={classes.map(item => ({
                                label: `${item.code} - ${item.description}`,
                                value: item.code,
                            }))}
                            loading={classLoading}
                            disabled={!ba.group}
                            className={`${selectClass} [&_.ant-select-selector]:!bg-white`}
                        />
                    </div>

                    {/* 5. Sub-class (Optional) */}
                    <div className="space-y-3">
                        <Paragraph className="!mb-0 text-[18px] font-medium text-textNearBlack">
                            5. Sub-class (5-digit code){' '}
                            <Text className="font-normal text-slate-500">(Optional)</Text>
                        </Paragraph>
                        <Select
                            placeholder="Select Activity"
                            value={ba.subclass || undefined}
                            onChange={v => setFieldValue('businessActivity.subclass', v)}
                            options={subclasses.map(item => ({
                                label: `${item.code} - ${item.description}`,
                                value: item.code,
                            }))}
                            loading={subclassLoading}
                            disabled={!ba.class}
                            className={`${selectClass} [&_.ant-select-selector]:!bg-white`}
                        />
                    </div>

                    {/* Primary Activity Selected summary */}
                    {showSelected && (
                        <Flex
                            gap={12}
                            align="flex-start"
                            className="bg-[rgba(250,244,255,0.78)] border-[1.336px] border-[#f5e9ff] rounded-[16px] p-4"
                        >
                            <AppstoreFilled
                                className="text-[24px] sm:text-[32px] shrink-0 mt-1"
                                style={{ color: '#a536ff' }}
                            />
                            <div className="flex-1 space-y-3 min-w-0">
                                <Paragraph className="!mb-0 text-[15px] sm:text-[20px] font-semibold text-[#a536ff] leading-[28px]">
                                    Primary Activity Selected
                                </Paragraph>
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <div className="flex-1 space-y-1 sm:space-y-2">
                                        <Paragraph className="!mb-0 text-[12px] sm:text-[16px] text-slate-600 leading-[24px]">
                                            NIC Code
                                        </Paragraph>
                                        <Paragraph className="!mb-0 text-[14px] sm:text-[18px] font-semibold text-slate-800 leading-[26px]">
                                            {ba.subclass}
                                        </Paragraph>
                                    </div>
                                    <div className="flex-1 space-y-1 sm:space-y-2">
                                        <Paragraph className="!mb-0 text-[12px] sm:text-[16px] text-slate-600 leading-[24px]">
                                            Activity
                                        </Paragraph>
                                        <Paragraph className="!mb-0 text-[14px] sm:text-[18px] font-semibold text-slate-800 leading-[26px]">
                                            {getLabelFromData(subclasses, ba.subclass ?? '')}
                                        </Paragraph>
                                    </div>
                                    <div className="flex-1 space-y-1 sm:space-y-2">
                                        <Paragraph className="!mb-0 text-[12px] sm:text-[16px] text-slate-600 leading-[24px]">
                                            Hierarchy
                                        </Paragraph>
                                        <Paragraph className="!mb-0 text-[14px] sm:text-[18px] font-semibold text-slate-800 leading-[26px] break-words">
                                            {[
                                                ba.section,
                                                ba.division,
                                                ba.group,
                                                ba.class,
                                                ba.subclass,
                                            ]
                                                .filter(Boolean)
                                                .join(' → ')}
                                        </Paragraph>
                                    </div>
                                </div>
                            </div>
                        </Flex>
                    )}
                </div>
            </div>

            {/* Secondary Business Activity */}
            <div className="border-[0.37px] border-zinc-200 rounded-[24px] p-6 space-y-3">
                <Paragraph className="!mb-0 text-[18px] font-semibold text-textNearBlack">
                    Secondary Business Activity
                </Paragraph>
                <Select
                    placeholder="Select Secondary business activity"
                    value={ba.secondaryActivity || undefined}
                    onChange={v => setFieldValue('businessActivity.secondaryActivity', v)}
                    options={sectionOptions}
                    className={selectClass}
                />
                <Text className="text-[12px] text-zinc-600 block">
                    Optional - Add additional business activities your company will engage in
                </Text>
            </div>

            {/* Other activities */}
            <div className="border-[0.37px] border-zinc-200 rounded-[22px] p-6 space-y-3">
                <Paragraph className="!mb-0 text-[18px] font-medium text-textNearBlack">
                    Other activities (if any)
                </Paragraph>
                <TextAreaInput
                    name="businessActivity.otherActivities"
                    placeholder="Enter other activities"
                    minRows={4}
                />
                <Text className={`text-[12px] block ${isOverActivityLimit ? 'text-errorTextRed' : 'text-zinc-600'}`}>
                    {isOverActivityLimit
                        ? `Maximum of 13 activities exceeded (${otherActivityLines}/13)`
                        : `You can add up to ${remainingActivities} more activities (${otherActivityLines}/13 used)`}
                </Text>
            </div>

            {/* Business Description */}
            <div className="border-[0.37px] border-zinc-200 rounded-[22px] p-6 space-y-3">
                <Paragraph className="!mb-0 text-[18px] font-medium text-textNearBlack">
                    Business Description<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                </Paragraph>
                <TextAreaInput
                    name="businessActivity.description"
                    placeholder="Enter a description of your business"
                    minRows={4}
                    maxLength={1000}
                    showCount
                    isRequired
                />
                <Text className="text-[12px] text-zinc-600 block">
                    Provide a brief description of your business operations (this will help in
                    drafting MOA)
                </Text>
            </div>

            {/* Example box */}
            <div className="bg-slate-50 px-4 py-[10px] rounded-[16px]">
                <Text className="text-[12px] font-medium text-[rgba(0,0,0,0.85)] block mb-1">
                    Example:
                </Text>
                <Text className="text-[12px] text-slate-500 block">
                    &ldquo;To carry on the business of software development, design, and
                    implementation of computer applications and mobile applications. To provide IT
                    consulting services, system integration, cloud computing solutions, and digital
                    transformation services to clients across various industries.&rdquo;
                </Text>
            </div>
        </div>
    );
};

export default BusinessActivity;
