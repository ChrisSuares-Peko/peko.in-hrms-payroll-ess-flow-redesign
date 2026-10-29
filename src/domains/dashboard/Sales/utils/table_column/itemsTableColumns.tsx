import { useEffect } from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Divider, Form } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getIn, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import {
    DECIMAL_QUANTITY_UNITS,
    GST_MODE_OPTIONS,
    GST_OPTIONS,
    UNIT_OPTIONS,
} from '../../constants/createDocument';
import { CatalogItemApiData } from '../../types/catalog';
import { CreateDocumentFormValues, ItemValues } from '../../types/createDocument';
import { computeNetAmount } from '../documentCalculations';

const NetAmountCell = ({ index }: { index: number }) => {
    const { values, setFieldValue } = useFormikContext<CreateDocumentFormValues>();
    const item = values.items[index];
    const net = computeNetAmount(item);
    const netStr = net > 0 ? net.toFixed(2) : '';

    useEffect(() => {
        setFieldValue(`items[${index}].netAmount`, netStr);
    }, [
        item.quantity,
        item.unitPrice,
        item.discount,
        item.taxRate,
        item.taxMode,
        setFieldValue,
        index,
        netStr,
    ]);

    return (
        <TextInput name={`items[${index}].netAmount`} placeholder="0.00" type="text" isDisabled />
    );
};

const QuantityCell = ({ index }: { index: number }) => {
    const { values, setFieldValue } = useFormikContext<CreateDocumentFormValues>();
    const unit = values.items[index]?.unit ?? '';
    const quantity = values.items[index]?.quantity ?? '';
    const allowsDecimals = !unit || DECIMAL_QUANTITY_UNITS.includes(unit);

    useEffect(() => {
        if (allowsDecimals) return;
        const str = String(quantity);
        if (!str.includes('.')) return;
        const num = parseFloat(str);
        const rounded = Number.isFinite(num) ? String(Math.round(num)) : '';
        setFieldValue(`items[${index}].quantity`, rounded);
    }, [allowsDecimals, quantity, setFieldValue, index]);

    return (
        <TextInput
            name={`items[${index}].quantity`}
            placeholder="Qty"
            type="text"
            allowTwoDecimalsOnly={allowsDecimals}
            allowNumbersOnly={!allowsDecimals}
            maxLength={6}
        />
    );
};

interface TitleCellProps {
    index: number;
    catalogItems: CatalogItemApiData[];
    catalogLoading: boolean;
    setSearchText: (text: string) => void;
    onAddNewItem: (index: number) => void;
}

const TitleCell = ({
    index,
    catalogItems,
    catalogLoading,
    setSearchText,
    onAddNewItem,
}: TitleCellProps) => {
    const { values, touched, errors, setFieldValue } = useFormikContext<CreateDocumentFormValues>();
    const item = values.items[index];
    const nameError = getIn(errors, `items[${index}].name`);
    const nameTouched = getIn(touched, `items[${index}].name`);

    const autoOptions = catalogItems.map(c => ({
        key: c.id,
        value: c.name,
        label: (
            <div className="flex justify-between items-center gap-2">
                <span>{c.name}</span>
                <span className="text-gray-400 text-xs shrink-0">
                    ₹{Number(c.unitPrice).toFixed(2)}
                </span>
            </div>
        ),
    }));

    const handleSelect = (name: string) => {
        const cat = catalogItems.find(c => c.name === name);
        if (cat) {
            setFieldValue(`items[${index}].unitPrice`, cat.unitPrice);
            setFieldValue(`items[${index}].taxRate`, cat.gstPercent ?? '0');
            setFieldValue(`items[${index}].hsn`, cat.hsnCode ?? '');
            setFieldValue(`items[${index}].productId`, String(cat.id));
        }
    };

    const handleChange = (val: string) => {
        setFieldValue(`items[${index}].name`, val);
        // Clear productId so this row is treated as manually entered
        setFieldValue(`items[${index}].productId`, undefined);
    };

    const dropdownRender = (menu: React.ReactElement) => (
        <>
            {menu}
            <Divider style={{ margin: '4px 0' }} />
            <Button
                type="text"
                danger
                block
                icon={<PlusOutlined />}
                onMouseDown={e => e.preventDefault()}
                onClick={() => onAddNewItem(index)}
                style={{ justifyContent: 'center' }}
            >
                Add new item
            </Button>
        </>
    );

    return (
        <Form.Item
            validateStatus={nameTouched && nameError ? 'error' : ''}
            help={nameTouched && nameError ? nameError : undefined}
        >
            <AutoComplete
                value={item?.name || ''}
                placeholder="Search or enter item name..."
                options={autoOptions}
                notFoundContent={catalogLoading ? 'Searching...' : undefined}
                onChange={handleChange}
                onSelect={handleSelect}
                onSearch={setSearchText}
                dropdownRender={dropdownRender}
                allowClear
                onClear={() => {
                    setFieldValue(`items[${index}].name`, '');
                    setFieldValue(`items[${index}].hsn`, '');
                    setFieldValue(`items[${index}].unitPrice`, '');
                    setFieldValue(`items[${index}].taxRate`, '0');
                    setFieldValue(`items[${index}].productId`, undefined);
                }}
                style={{ width: '100%' }}
            />
        </Form.Item>
    );
};

export type CatalogColumnProps = {
    catalogItems: CatalogItemApiData[];
    catalogLoading: boolean;
    setSearchText: (text: string) => void;
    onAddNewItem: (index: number) => void;
};

const topCell = () => ({ style: { verticalAlign: 'top' as const } });

export const getItemsTableColumns = (
    remove: (index: number) => void,
    rowCount: number,
    catalogProps?: CatalogColumnProps
): ColumnsType<ItemValues & { key: number }> => [
    {
        title: 'Title',
        minWidth: 200,
        onCell: topCell,
        render: (_, __, index) =>
            catalogProps ? (
                <TitleCell index={index} {...catalogProps} />
            ) : (
                <TextInput name={`items[${index}].name`} placeholder="Title" type="text" />
            ),
    },
    {
        title: 'HSN',
        width: 110,
        onCell: topCell,
        render: (_, __, index) => (
            <TextInput
                name={`items[${index}].hsn`}
                placeholder="HSN"
                type="text"
                allowNumbersOnly
                maxLength={8}
            />
        ),
    },
    {
        title: 'Quantity',
        width: 100,
        onCell: topCell,
        render: (_, __, index) => <QuantityCell index={index} />,
    },
    {
        title: 'Unit',
        width: 80,
        onCell: topCell,
        render: (_, __, index) => (
            <SelectInput name={`items[${index}].unit`} placeholder="Unit" options={UNIT_OPTIONS} />
        ),
    },
    {
        title: 'Unit Price (₹)',
        width: 120,
        onCell: topCell,
        render: (_, __, index) => (
            <TextInput
                name={`items[${index}].unitPrice`}
                placeholder="Price"
                type="text"
                allowTwoDecimalsOnly
                maxLength={10}
            />
        ),
    },
    {
        title: <span className="whitespace-nowrap">Discount (%)</span>,
        width: 70,
        onCell: topCell,
        render: (_, __, index) => (
            <TextInput
                name={`items[${index}].discount`}
                placeholder="0"
                type="text"
                allowTwoDecimalsOnly
                maxLength={5}
            />
        ),
    },
    {
        title: 'Tax Rate (%)',
        width: 80,
        onCell: topCell,
        render: (_, __, index) => (
            <SelectInput name={`items[${index}].taxRate`} placeholder="GST" options={GST_OPTIONS} />
        ),
    },
    {
        title: 'Tax Type',
        width: 115,
        onCell: topCell,
        render: (_, __, index) => (
            <div style={{ width: 115, overflow: 'hidden' }}>
                <SelectInput
                    name={`items[${index}].taxMode`}
                    placeholder="Tax Type"
                    options={GST_MODE_OPTIONS}
                />
            </div>
        ),
    },
    {
        title: 'Net Amount (₹)',
        width: 165,
        onCell: topCell,
        render: (_, __, index) => <NetAmountCell index={index} />,
    },
    {
        title: '',
        width: 10,
        onCell: topCell,
        render: (_, __, index) => (
            <DeleteOutlined
                onClick={rowCount > 1 ? () => remove(index) : undefined}
                className={
                    rowCount > 1
                        ? 'text-red-500 cursor-pointer text-sm'
                        : 'text-gray-300 cursor-not-allowed text-sm'
                }
            />
        ),
    },
];
