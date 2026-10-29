import { Form, Select } from 'antd';

import { Director } from './types';

export type DirectorPrefill = {
    name: string;
    nationality: '' | 'Indian' | 'Foreign';
    email: string;
    phone: string;
    pan: string;
};

type DirectorSelectProps = {
    directors: Director[];
    indianNationalityValue: string;
    selectedIdx: number;
    onSelect: (prefill: DirectorPrefill) => void;
};

/**
 * Director picker for the shareholder instance form: maps the chosen director's
 * data to shareholder prefill values (nationality normalized to Indian/Foreign).
 * Not a Formik-bound field — the selection drives sibling field writes instead.
 */
export default function DirectorSelect({
    directors,
    indianNationalityValue,
    selectedIdx,
    onSelect,
}: DirectorSelectProps) {
    if (directors.length === 0) {
        return (
            <div className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-700">No directors found</p>
                <p className="text-xs text-amber-600">
                    Please fill in the director details in the previous section first.
                </p>
            </div>
        );
    }

    const handleSelect = (idx: number) => {
        const dir = directors[idx];
        if (!dir) return;

        let nationality: DirectorPrefill['nationality'] = '';
        if (dir.nationality) {
            nationality =
                dir.nationality.toLowerCase() === indianNationalityValue ? 'Indian' : 'Foreign';
        }

        onSelect({
            name: dir.name,
            nationality,
            email: dir.email,
            phone: dir.phone,
            pan: nationality === 'Indian' ? dir.pan || '' : '',
        });
    };

    return (
        <Form.Item label={<span>Shareholder Name</span>} required colon={false}>
            <Select
                showSearch
                placeholder="Select a director"
                value={selectedIdx >= 0 ? String(selectedIdx) : undefined}
                options={directors.map((d, i) => ({ label: d.name, value: String(i) }))}
                filterOption={(input, option) =>
                    String(option?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                }
                onChange={value => {
                    if (value === undefined || value === null || value === '') return;
                    handleSelect(parseInt(String(value), 10));
                }}
            />
        </Form.Item>
    );
}
