import React from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Table, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import CatalogFormModal from './CatalogFormModal';
import { useCatalogSearch } from '../../hooks/useCatalogSearch';
import { CreateDocumentFormValues, ItemValues } from '../../types/createDocument';
import { getItemsTableColumns } from '../../utils/table_column/itemsTableColumns';

const INITIAL_ITEM: ItemValues = {
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
}

const ItemsTable = ({ defaultTaxRate = '0' }: ItemsTableProps) => {
    const { values } = useFormikContext<CreateDocumentFormValues>();
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
    } = useCatalogSearch();

    return (
        <>
            <FieldArray name="items">
                {({ push, remove }) => (
                    <Flex vertical gap={20}>
                        <Flex justify="space-between" align="center" gap={12} wrap>
                            <Typography.Text className="text-xl font-medium">Items</Typography.Text>
                            <Button
                                onClick={() =>
                                    push({
                                        ...INITIAL_ITEM,
                                        taxRate: defaultTaxRate,
                                        itemId: crypto.randomUUID(),
                                    })
                                }
                                className="h-9 w-full sm:w-auto px-4 rounded-lg border border-[#cbd5e1] text-[#475569] font-medium"
                                icon={<PlusOutlined />}
                            >
                                Add Item
                            </Button>
                        </Flex>

                        <Flex className="items-table-scroll overflow-x-auto rounded-2xl border border-[#cbd5e1] shadow-sm">
                            <Table
                                dataSource={values.items.map((item, index) => ({
                                    ...item,
                                    key: index,
                                }))}
                                columns={getItemsTableColumns(remove, values.items.length, {
                                    catalogItems,
                                    catalogLoading: isLoading,
                                    setSearchText,
                                    onAddNewItem: handleOpenAddModal,
                                })}
                                pagination={false}
                                size="small"
                                scroll={{ x: 1200 }}
                                className="w-full [&_.ant-form-item]:mb-0 [&_.ant-form-item]:w-full [&_.ant-form-item-control-input]:w-full [&_.ant-table-cell]:py-3 [&_.ant-table-tbody_.ant-table-cell]:!ps-5 [&_.ant-table-thead_th:before]:!hidden [&_.ant-table-tbody>tr:hover>td]:!bg-transparent"
                                components={{
                                    header: {
                                        cell: ({
                                            className,
                                            ...props
                                        }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                            <th
                                                {...props}
                                                className={`${className ?? ''} !bg-black !text-white font-semibold text-sm !py-5 !ps-5 !border-r-0 whitespace-nowrap`}
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
