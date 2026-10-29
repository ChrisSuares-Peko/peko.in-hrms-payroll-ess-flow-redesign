import React, { useEffect, useRef } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Table, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import { useInvoiceCatalogSearch } from '../../hooks/createInvoice/useInvoiceCatalogSearch';
import { ItemValues } from '../../types/createInvoice';
import {
    CreditNoteAvailableProduct,
    getItemsTableColumns,
} from '../../utils/table_column/itemsTableColumns';
import CatalogFormModal from '../catalog/CatalogFormModal';

const BASE_ITEM: Omit<ItemValues, 'taxRate'> = {
    name: '',
    hsn: '',
    quantity: '',
    unit: '',
    unitPrice: '',
    discount: '0',
    taxMode: 'Exclusive',
    netAmount: '',
};

const BLANK_CREDIT_NOTE_ITEM: ItemValues = {
    name: '',
    hsn: '',
    quantity: '',
    unit: '',
    unitPrice: '',
    discount: '0',
    taxRate: '0',
    taxMode: 'Exclusive',
    netAmount: '',
};

interface ItemsTableProps {
    defaultTaxRate?: string;
    creditNoteAvailableProducts?: CreditNoteAvailableProduct[];
}

const ItemsTable = ({ defaultTaxRate = '0', creditNoteAvailableProducts }: ItemsTableProps) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const isCreditNoteMode = !!creditNoteAvailableProducts;

    const usedItemIds = new Set(
        (values.items as ItemValues[]).map(it => it.itemId).filter(Boolean)
    );
    const canAddMoreCreditNoteItems = isCreditNoteMode
        ? (creditNoteAvailableProducts as CreditNoteAvailableProduct[]).some(
              p => !usedItemIds.has(p.itemId)
          )
        : true;

    const {
        catalogItems,
        isLoading,
        setSearchText,
        isModalOpen,
        isSubmitting,
        catalogFormik,
        handleOpenAddModal,
        handleClose,
        handleModalSubmit,
    } = useInvoiceCatalogSearch();

    // Catalog prices are always in INR — whenever currency or the exchange rate
    // changes, re-derive every catalog-linked item's price, same as Peko-AE.
    const currency = values.invoice?.currency;
    const exchangeRate = values.invoice?.exchangeRate;
    const prevCurrencyRateRef = useRef({ currency, exchangeRate });

    useEffect(() => {
        const prev = prevCurrencyRateRef.current;
        const changed = prev.currency !== currency || prev.exchangeRate !== exchangeRate;
        prevCurrencyRateRef.current = { currency, exchangeRate };

        if (isCreditNoteMode || !changed || !catalogItems.length) return;

        const isForeignCurrency = !!currency && currency !== 'INR';
        const rate = Number(exchangeRate);

        (values.items as ItemValues[]).forEach((item, index) => {
            if (!item.productId) return;
            const catalogItem = catalogItems.find(c => String(c.id) === item.productId);
            if (!catalogItem) return;

            const newPrice =
                isForeignCurrency && rate > 0
                    ? String(Number(catalogItem.unitPrice) / rate)
                    : catalogItem.unitPrice;

            if (item.unitPrice !== newPrice) {
                setFieldValue(`items[${index}].unitPrice`, newPrice);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currency, exchangeRate, catalogItems, isCreditNoteMode]);

    return (
        <>
            <FieldArray name="items">
                {({ push, remove }) => (
                    <Flex vertical gap={20}>
                        <Flex justify="space-between" align="center" gap={12} wrap>
                            <Typography.Text className="text-xl font-medium">Items</Typography.Text>
                            <Button
                                onClick={() =>
                                    push(
                                        isCreditNoteMode
                                            ? { ...BLANK_CREDIT_NOTE_ITEM }
                                            : {
                                                  ...BASE_ITEM,
                                                  taxRate:
                                                      values.invoice?.type === 'INTERNATIONAL'
                                                          ? 'EXPORT_0'
                                                          : defaultTaxRate,
                                                  itemId: crypto.randomUUID(),
                                              }
                                    )
                                }
                                disabled={isCreditNoteMode && !canAddMoreCreditNoteItems}
                                className="h-9 w-full sm:w-auto px-4 rounded-lg border border-[#cbd5e1] text-[#475569] font-medium"
                                icon={<PlusOutlined />}
                            >
                                Add Item
                            </Button>
                        </Flex>

                        <Flex className="items-table-scroll overflow-x-auto rounded-2xl border border-[#cbd5e1] shadow-sm">
                            <Table
                                dataSource={values.items.map((item: ItemValues, index: number) => ({
                                    ...item,
                                    key: index,
                                }))}
                                columns={getItemsTableColumns(
                                    remove,
                                    values.items.length,
                                    {
                                        catalogItems,
                                        catalogLoading: isLoading,
                                        setSearchText,
                                        onAddNewItem: handleOpenAddModal,
                                    },
                                    creditNoteAvailableProducts,
                                    values.invoice?.type,
                                    values.invoice?.currency
                                )}
                                pagination={false}
                                size="small"
                                scroll={{ x: 1200 }}
                                className="w-full [&_.ant-form-item]:mb-0 [&_.ant-form-item]:w-full [&_.ant-form-item-control-input]:w-full [&_.ant-table-cell]:py-3 [&_.ant-table-thead_th:before]:!hidden"
                                components={{
                                    header: {
                                        cell: ({
                                            className,
                                            ...props
                                        }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                            <th
                                                {...props}
                                                className={`${className ?? ''} !bg-black !text-white font-semibold text-sm !py-5 !ps-5 !border-r-0 !whitespace-nowrap`}
                                            />
                                        ),
                                    },
                                }}
                            />
                        </Flex>
                    </Flex>
                )}
            </FieldArray>

            <CatalogFormModal
                open={isModalOpen}
                onClose={handleClose}
                onSubmit={handleModalSubmit}
                isSubmitting={isSubmitting}
                editingItem={null}
                formik={catalogFormik}
            />
        </>
    );
};

export default ItemsTable;
