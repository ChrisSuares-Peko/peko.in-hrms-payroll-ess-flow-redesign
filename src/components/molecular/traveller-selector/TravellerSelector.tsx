import React, { useMemo } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Flex, Form, Popconfirm } from 'antd';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import { TravellerOption } from '@customtypes/savedTraveller';

interface TravellerSelectorProps {
    name: string;
    label: string;
    placeholder?: string;
    employeeOptions?: TravellerOption[];
    savedOptions?: TravellerOption[];
    onSelect: (option: TravellerOption) => void;
    onDeleteSaved?: (savedId: number) => void;
    onClear?: () => void;
}

// Presentational merged, searchable dropdown: employees + saved travellers as two grouped
// sections. Saved options carry an inline delete (with confirm). Data-fetching + saving live in
// useSavedTravellers (owned by the consumer) so the consumer controls placement of the dropdown
// and the Save action.
const TravellerSelector: React.FC<TravellerSelectorProps> = ({
    name,
    label,
    placeholder = 'Select employee or saved traveller',
    employeeOptions = [],
    savedOptions = [],
    onSelect,
    onDeleteSaved,
    onClear,
}) => {
    const empOptions = useMemo<TravellerOption[]>(
        () => (employeeOptions || []).map(o => ({ ...o, source: o.source ?? 'employee' })),
        [employeeOptions]
    );

    const groupedOptions = useMemo(() => {
        const groups: { label: string; options: TravellerOption[] }[] = [];
        if (empOptions.length) groups.push({ label: 'Employees', options: empOptions });
        if (savedOptions.length) groups.push({ label: 'Saved travellers', options: savedOptions });
        return groups;
    }, [empOptions, savedOptions]);

    const optionByValue = useMemo(() => {
        const map = new Map<string, TravellerOption>();
        [...empOptions, ...savedOptions].forEach(o => map.set(o.value, o));
        return map;
    }, [empOptions, savedOptions]);

    if (!empOptions.length && !savedOptions.length) return null;

    const renderOption = (opt: any) => {
        const data = (opt?.data ?? {}) as TravellerOption;
        const text = (data.label ?? opt?.label) as React.ReactNode;
        if (onDeleteSaved && data.source === 'saved' && data.savedId != null) {
            return (
                <Flex justify="space-between" align="center" gap={8}>
                    <span className="truncate">{text}</span>
                    <Popconfirm
                        title="Remove this saved traveller?"
                        okText="Remove"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        onConfirm={e => {
                            e?.stopPropagation?.();
                            onDeleteSaved(data.savedId as number);
                        }}
                        onCancel={e => e?.stopPropagation?.()}
                    >
                        <DeleteOutlined
                            className="text-red-500"
                            onClick={e => e.stopPropagation()}
                        />
                    </Popconfirm>
                </Flex>
            );
        }
        return <span className="truncate">{text}</span>;
    };

    return (
        <Form layout="vertical" component={false}>
            <SelectInputWithSearch
                name={name}
                label={label}
                placeholder={placeholder}
                options={groupedOptions as any}
                optionRender={renderOption}
                handleChange={(value: string) => {
                    if (!value) {
                        onClear?.();
                        return;
                    }
                    const option = optionByValue.get(value);
                    if (option) onSelect(option);
                }}
                classes="w-full"
            />
        </Form>
    );
};

export default TravellerSelector;
