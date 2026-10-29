import { useEffect, useMemo, useState } from 'react';

import { Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import { useAppSelector } from '@src/hooks/store';

import SelectedActivityCard from './SelectedActivityCard';
import { getBusinessActivities } from '../../../api';
import { normalizeNic, NicOption } from '../../../utils/nic';
import FieldError from '../../FieldError';

const { Text } = Typography;

// Relevance rank for a search term: name prefix < word-start < substring < code-only.
const rankMatch = (name: string, q: string): number => {
    const n = name.toLowerCase();
    if (n.startsWith(q)) return 0;
    if (n.split(/[^a-z0-9]+/).some(w => w.startsWith(q))) return 1;
    if (n.includes(q)) return 2;
    return 3;
};

interface ActivityValues {
    businessActivities?: NicOption[];
    activitySearch?: string;
}

interface BusinessActivityProps {
    // Max Level-3 activities (3 for most entities, 2 for OPC).
    maxActivities?: number;
    // Partnership: skip the NIC activity picker — just the free-text description.
    descriptionOnly?: boolean;
}

// "Business Activity" (Figma 1848:27738) — NIC-2008 Level-3 picker. Selecting an
// activity appends a card with its auto-mapped Level 2 & Level 1, up to the max.
const BusinessActivity = ({ maxActivities = 3, descriptionOnly }: BusinessActivityProps) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { values, setFieldValue } = useFormikContext<ActivityValues>();
    const [nicOptions, setNicOptions] = useState<NicOption[]>([]);
    const [query, setQuery] = useState('');

    const selected = useMemo(() => values.businessActivities || [], [values.businessActivities]);
    const atMax = selected.length >= maxActivities;

    useEffect(() => {
        let active = true;
        getBusinessActivities({ userId: Number(userId), userType: userType ?? '' }).then(res => {
            if (active && res) setNicOptions(normalizeNic(res));
        });
        return () => {
            active = false;
        };
    }, [userId, userType]);

    // Hide selected activities; rank name matches (prefix/word-start first).
    const options = useMemo(() => {
        const chosen = new Set(selected.map(a => a.code));
        const q = query.trim().toLowerCase();
        const avail = nicOptions.filter(o => !chosen.has(o.code));
        const ordered = q
            ? avail
                  .map((o, i) => ({ o, i, r: rankMatch(o.label, q) }))
                  .sort((a, b) => a.r - b.r || a.i - b.i)
                  .map(x => x.o)
            : avail;
        return ordered.map(o => ({ label: `${o.code} — ${o.label}`, value: o.code }));
    }, [nicOptions, selected, query]);

    const handleAdd = (code: string) => {
        const opt = nicOptions.find(o => o.code === code);
        setFieldValue('activitySearch', '');
        setQuery('');
        if (!opt || atMax || selected.some(a => a.code === code)) return;
        setFieldValue('businessActivities', [...selected, opt]);
    };

    const handleRemove = (index: number) => {
        setFieldValue(
            'businessActivities',
            selected.filter((_, i) => i !== index)
        );
    };

    // Partnership: no NIC picker — just a free-text "Business Activity" description.
    if (descriptionOnly) {
        return (
            <div className="flex flex-col gap-3">
                <Text className="!block !text-[18px] !font-semibold !text-[#1e293b] !leading-[26px]">
                    Business Activity
                </Text>
                <div className="border border-[#e4e4e7] rounded-[24px] p-3 sm:p-6">
                    <TextAreaInput
                        label="Business Activity"
                        name="businessDescription"
                        placeholder="Describe the main business activity"
                        isRequired
                        minRows={3}
                        maxLength={1000}
                        showCount
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div>
                <Text className="!block !text-[18px] !font-semibold !text-[#1e293b] !leading-[26px]">
                    Business Activity
                </Text>
                <Text className="!text-[14px] !text-[#475569] !leading-[24px]">
                    Aligned with MCA (NIC-2008). Select up to {maxActivities} Level-3 activities —
                    Level 2 &amp; Level 1 are mapped back automatically.
                </Text>
            </div>
            <div className="border border-[#e4e4e7] rounded-[24px] p-3 sm:p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <SelectInput
                        label={
                            <span>
                                Add activity{' '}
                                <span className="text-[#909090]">
                                    ({selected.length}/{maxActivities} selected)
                                </span>
                            </span>
                        }
                        name="activitySearch"
                        options={options}
                        placeholder={atMax ? `Maximum ${maxActivities} activities selected` : 'Search activity'}
                        handleChange={handleAdd}
                        isDisabled={atMax}
                        showSearch
                        isRequired
                        formItemClass="!mb-0"
                        popupClassName="br-activity-options"
                        onSearch={setQuery}
                        // Search the label (name + code), not just the code value.
                        filterOption={(input, option) => {
                            const q = String(input).trim().toLowerCase();
                            const label = String(option?.children ?? option?.label ?? '').toLowerCase();
                            const code = String(option?.value ?? '').toLowerCase();
                            return label.includes(q) || code.includes(q);
                        }}
                        size="large"
                    />
                    <FieldError name="businessActivities" />
                </div>

                {selected.map((activity, i) => (
                    <SelectedActivityCard
                        key={activity.code}
                        activity={activity}
                        index={i + 1}
                        onRemove={() => handleRemove(i)}
                    />
                ))}

                <div className="h-px w-full bg-[#ebebeb]" />

                <TextAreaInput
                    label="Business description (10–1000 characters)"
                    name="businessDescription"
                    placeholder="Describe the main business activity"
                    isRequired
                    minRows={3}
                    maxLength={1000}
                    showCount
                />
            </div>
        </div>
    );
};

export default BusinessActivity;
