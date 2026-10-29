import { PlusOutlined } from '@ant-design/icons';
import { Divider, Form, Select } from 'antd';
import { useField } from 'formik';

interface VendorDirectorSelectProps {
    name: string;
    label?: string;
    options: { label: string; value: string }[];
    placeholder: string;
    isDisabled: boolean;
    onSelectDirector: (directorId: string) => void;
    onAddDirector: () => void;
}

const VendorDirectorSelect = ({ name, label = 'Authorized Person', options, placeholder, isDisabled, onSelectDirector, onAddDirector }: VendorDirectorSelectProps) => {
    const [field, meta] = useField(name);
    const hasError = Boolean(meta.touched && meta.error);
    const resolvedValue = options.some((option) => option.value === field.value) ? field.value : undefined;

    return (
        <Form.Item
            label={<span title="">{label}</span>}
            colon={false}
            required
            validateStatus={hasError ? 'error' : ''}
            help={hasError ? meta.error : undefined}
        >
            <Select
                id={name}
                value={resolvedValue}
                placeholder={placeholder}
                disabled={isDisabled}
                showSearch
                optionFilterProp="label"
                className="h-10"
                onChange={onSelectDirector}
                options={options}
                notFoundContent={<span />}
                dropdownRender={(menu) => (
                    <>
                        {options.length > 0 && (
                            <>
                                {menu}
                                <Divider style={{ margin: '4px 0' }} />
                            </>
                        )}
                        <div
                            role="button"
                            tabIndex={0}
                            className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-[#f5f5f5] rounded"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={onAddDirector}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') onAddDirector();
                            }}
                        >
                            <PlusOutlined />
                            <span>Add Director</span>
                        </div>
                    </>
                )}
            />
        </Form.Item>
    );
};

export default VendorDirectorSelect;
