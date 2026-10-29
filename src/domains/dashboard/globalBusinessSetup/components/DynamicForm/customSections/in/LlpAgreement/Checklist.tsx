import { Checkbox } from 'antd';

import { Choice } from './constants';

type ChecklistProps = {
    title: string;
    description: string;
    options: Choice[];
    selected: string[];
    onToggle: (key: string) => void;
};

export default function Checklist({
    title,
    description,
    options,
    selected,
    onToggle,
}: ChecklistProps) {
    return (
        <section className="space-y-2">
            <div>
                <h3 className="text-base font-semibold text-gray-800">
                    {title} <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-3">
                    {options.map(option => (
                        <div key={option.key} className="flex items-start gap-1">
                            <Checkbox
                                checked={selected.includes(option.key)}
                                onChange={() => onToggle(option.key)}
                            />
                            <span className="text-sm text-gray-700 ml-2">{option.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
