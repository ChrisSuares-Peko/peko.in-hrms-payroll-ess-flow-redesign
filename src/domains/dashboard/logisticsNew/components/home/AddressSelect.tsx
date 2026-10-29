import { PlusOutlined } from '@ant-design/icons';
import { Form, Select, Typography } from 'antd';

interface AddressSelectProps {
    label: string;
    options: { label: string; value: string }[];
    value: string | undefined;
    onChange: (val: string) => void;
    onClear: () => void;
    onAddNew: () => void;
    onEdit?: (addressValue: string) => void;
    onDelete?: (addressValue: string) => void;
    error?: string;
    touched?: boolean;
}

const parseAddressLines = (value?: string) => {
    try {
        const parsed = JSON.parse(value ?? '');
        return { address1: parsed?.address1 ?? '', address2: parsed?.address2 ?? '' };
    } catch {
        return { address1: '', address2: '' };
    }
};

const AddressSelect = ({
    label,
    options,
    value,
    onChange,
    onClear,
    onAddNew,
    onEdit,
    onDelete,
    error,
    touched,
}: AddressSelectProps) => (
    <div className="mb-4">
        <Form.Item
            label={
                <span className="text-[11px] text-gray-600 font-medium">
                    {label}
                    <span className="text-red-500 ml-0.5">*</span>
                </span>
            }
            validateStatus={touched && error ? 'error' : ''}
            help={touched && error ? error : undefined}
            className="mb-0"
        >
            <Select
                showSearch
                placeholder={<span className="text-xs">Select address</span>}
                value={value || undefined}
                options={options}
                allowClear
                filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={onChange}
                onClear={onClear}
                className="w-full"
                labelRender={props => {
                    const { address1, address2 } = parseAddressLines(props.value as string);
                    const addressLine = [address1, address2].filter(Boolean).join(', ');
                    return (
                        <span className="flex flex-col leading-tight py-0.5">
                            <span className="text-sm truncate">{props.label}</span>
                            {addressLine && (
                                <Typography.Text className="text-xs truncate" type="secondary">
                                    {addressLine}
                                </Typography.Text>
                            )}
                        </span>
                    );
                }}
                optionRender={option => {
                    const { address1, address2 } = parseAddressLines(option.value as string);
                    return (
                        <div className="flex flex-col gap-1 w-full">
                            <div className="text-sm font-medium truncate">{option.label}</div>
                            {address1 && (
                                <Typography.Text className="text-xs block" type="secondary">
                                    {address1}
                                </Typography.Text>
                            )}
                            {address2 && (
                                <Typography.Text className="text-xs block" type="secondary">
                                    {address2}
                                </Typography.Text>
                            )}
                            {(onEdit || onDelete) && (
                                <div className="flex gap-3 pt-0.5">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            className="text-[11px] text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0 leading-none"
                                            onMouseDown={e => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                onEdit(option.value as string);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            type="button"
                                            className="text-[11px] text-brandColor hover:text-red-600 bg-transparent border-0 cursor-pointer p-0 leading-none"
                                            onMouseDown={e => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                onDelete(option.value as string);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }}
            />
        </Form.Item>
        <button
            type="button"
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-0.5 mt-1.5 bg-transparent border-0 cursor-pointer p-0"
            onClick={onAddNew}
        >
            <PlusOutlined className="text-[10px]" /> Add new address
        </button>
    </div>
);

export default AddressSelect;
