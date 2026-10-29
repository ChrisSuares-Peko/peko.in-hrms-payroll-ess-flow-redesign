import { useMemo, useState } from 'react';

import { CompressOutlined, ExpandOutlined } from '@ant-design/icons';
import { Modal, Table, Input, Form, Select, Button, Space } from 'antd';
import { Field, FieldProps, getIn } from 'formik';

interface TableSelectInputProps {
    name: string;
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    columns: any[];
    dataSource: any[];
    primaryKey?: string;
    loading?: boolean;
}

const TableSelectInput: React.FC<TableSelectInputProps> = ({
    name,
    label,
    placeholder,
    isRequired,
    columns,
    dataSource,
    primaryKey,
    loading,
}) => {
    const [open, setOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string | undefined>(undefined);
    const [fullscreen, setFullscreen] = useState(false);

    const resolvedPrimaryKey = primaryKey || 'key';

    // ---------------------------------------------------
    // ✅ Build category options dynamically
    // ---------------------------------------------------
    const categoryOptions = useMemo(() => {
        const set = new Set<string>();

        dataSource?.forEach(row => {
            if (row.category) {
                set.add(String(row.category));
            }
        });

        return Array.from(set).map(v => ({
            label: v,
            value: v,
        }));
    }, [dataSource]);

    // ---------------------------------------------------
    // ✅ Filtered table data (search + category)
    // ---------------------------------------------------
    const filteredData = useMemo(
        () =>
            (dataSource || []).filter(row => {
                const matchesCategory = !category || String(row.category) === String(category);

                const matchesSearch =
                    !search ||
                    Object.values(row).some(val =>
                        String(val).toLowerCase().includes(search.toLowerCase())
                    );

                return matchesCategory && matchesSearch;
            }),
        [dataSource, search, category]
    );

    return (
        <Field name={name}>
            {({ field, form: { setFieldValue, touched, errors } }: FieldProps) => {
                const error = getIn(errors, name);
                const isTouched = getIn(touched, name);

                return (
                    <>
                        {/* ✅ Input */}
                        <Form.Item
                            label={label}
                            required={isRequired}
                            validateStatus={isTouched && error ? 'error' : ''}
                            help={isTouched && error ? error : undefined}
                        >
                            <Input
                                {...field}
                                readOnly
                                placeholder={placeholder || 'Select'}
                                onClick={() => setOpen(true)}
                                className="cursor-pointer"
                            />
                        </Form.Item>

                        {/* ✅ Modal */}
                        <Modal
                            open={open}
                            title={
                                <div className="flex justify-between items-center pr-12">
                                    <span>{label}</span>

                                    <Button
                                        type="text"
                                        icon={
                                            fullscreen ? <CompressOutlined /> : <ExpandOutlined />
                                        }
                                        onClick={() => setFullscreen(prev => !prev)}
                                    />
                                </div>
                            }
                            onCancel={() => setOpen(false)}
                            width={fullscreen ? '100vw' : 850}
                            style={fullscreen ? { top: 0, paddingBottom: 0 } : undefined}
                            bodyStyle={fullscreen ? { height: '90vh' } : undefined}
                            footer={null}
                            centered={!fullscreen}
                            destroyOnClose
                        >
                            {/* 🔍 Filters */}
                            <Space className="w-full mb-3" size="middle">
                                <Input
                                    placeholder="Search..."
                                    allowClear
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ width: 260 }}
                                />

                                <Select
                                    allowClear
                                    placeholder="Filter by Category"
                                    value={category}
                                    onChange={val => setCategory(val)}
                                    options={categoryOptions}
                                    style={{ width: 240 }}
                                />
                            </Space>

                            {/* 📊 Table */}
                            <Table
                                size="small"
                                loading={loading}
                                columns={columns}
                                dataSource={filteredData}
                                pagination={{ pageSize: 10 }}
                                scroll={{ y: 320 }}
                                rowKey={resolvedPrimaryKey}
                                onRow={record => ({
                                    onClick: () => {
                                        setSelectedRow(record);
                                    },
                                })}
                                rowClassName={record =>
                                    record?.[resolvedPrimaryKey] ===
                                    selectedRow?.[resolvedPrimaryKey]
                                        ? 'bg-blue-50'
                                        : 'cursor-pointer'
                                }
                            />

                            {/* ✅ Footer buttons */}
                            <div className="flex justify-end gap-3 mt-4">
                                <Button onClick={() => setOpen(false)}>Close</Button>

                                <Button
                                    type="primary"
                                    danger
                                    disabled={!selectedRow}
                                    onClick={() => {
                                        const value = selectedRow?.[resolvedPrimaryKey];

                                        if (!value) return;

                                        setFieldValue(name, value);
                                        setOpen(false);
                                    }}
                                >
                                    Select
                                </Button>
                            </div>
                        </Modal>
                    </>
                );
            }}
        </Field>
    );
};

export default TableSelectInput;
