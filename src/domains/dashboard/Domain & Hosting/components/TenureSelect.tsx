import { Select } from 'antd';

interface TenureOption {
    value: number;
    label: string;
}

interface TenureSelectProps {
    options: TenureOption[];
    value: number;
    onChange: (value: number) => void;
    width?: number;
}

const TenureSelect = ({ options, value, onChange, width = 120 }: TenureSelectProps) => (
    <Select
        options={options}
        value={value}
        onChange={onChange}
        style={{ width }}
    />
);

export default TenureSelect;
