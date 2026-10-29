import { useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Flex, Form, Select, Typography } from 'antd';
import { ErrorMessage, useFormikContext } from 'formik';

import { DropDown } from '@customtypes/general';

type Props = {
    name?: string;
    options: DropDown | any[];
    label: string;
    showSearch?: boolean;
    showLabelAfterSelect?: boolean;
    handleChange?: (option: any) => void;
    onAddOptionClick?: any;
    showAddOption?: boolean;
};

const CustomSelect = ({
    options,
    label,
    name,
    showSearch,
    showLabelAfterSelect,
    handleChange,
    onAddOptionClick,
    showAddOption,
}: Props) => {
    const [value, setValue] = useState();
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const handleUpdate = (_: any, option: any) => {
        setValue(option);
        if (handleChange) {
            handleChange(option);
        }
    };

    const { values }: any = useFormikContext();
    return (
        <Form.Item className="mb-0" label={label}>
            <Flex align="center" className="border border-gray-300 px-1 py-2 rounded-sm ">
                {showLabelAfterSelect && value && (
                    <Typography.Text className="text-gray-500  text-nowrap">
                        {label}
                    </Typography.Text>
                )}
                <Select
                    onOpenChange={visibility => setDropdownOpen(visibility)}
                    open={isDropdownOpen}
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    placeholder={label}
                    allowClear
                    options={[
                        ...options,
                        ...(showAddOption
                            ? [
                                  {
                                      label: (
                                          <div
                                              role="button"
                                              tabIndex={0}
                                              onClick={e => {
                                                  e.stopPropagation(); // Prevents dropdown selection
                                                  if (onAddOptionClick) onAddOptionClick();
                                                  setDropdownOpen(false);
                                              }}
                                              onKeyDown={e => {
                                                  if (e.key === 'Enter' || e.key === ' ') {
                                                      e.stopPropagation();
                                                      if (onAddOptionClick) onAddOptionClick();
                                                      setDropdownOpen(false);
                                                  }
                                              }}
                                              style={{ display: 'flex', alignItems: 'center' }}
                                          >
                                              <PlusOutlined
                                                  style={{ marginRight: 8, color: 'textRed' }}
                                              />
                                              Add Customer
                                          </div>
                                      ),
                                      value: 'add-department',
                                  },
                              ]
                            : []),
                    ]}
                    className={`${showLabelAfterSelect && value ? 'text-end' : 'text-start'} h-5`}
                    variant="borderless"
                    showSearch={showSearch}
                    onChange={handleUpdate}
                    value={name && values?.[name] ? values[name] : undefined}
                />
            </Flex>
            {name && (
                <ErrorMessage
                    name={name}
                    component="div"
                    className="error-message w-full text-red-500"
                />
            )}
        </Form.Item>
    );
};

export default CustomSelect;
