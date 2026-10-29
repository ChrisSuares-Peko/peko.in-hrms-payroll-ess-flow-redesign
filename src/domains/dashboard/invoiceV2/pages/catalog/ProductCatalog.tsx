import React from 'react';

import { Content } from 'antd/es/layout/layout';

import CatalogFormModal from '../../components/catalog/CatalogFormModal';
import CatalogHeader from '../../components/catalog/CatalogHeader';
import CatalogTable from '../../components/catalog/CatalogTable';
import { useProductCatalog } from '../../hooks/catalog/useProductCatalog';

const ProductCatalog = () => {
    const {
        items,
        total,
        isLoading,
        search,
        updateSearchText,
        range,
        setRange,
        page,
        setPage,
        pageSize,
        setPageSize,
        isModalOpen,
        isSubmitting,
        editingItem,
        formik,
        handleOpenAdd,
        handleOpenEdit,
        handleClose,
        handleDelete,
    } = useProductCatalog();

    return (
        <Content className="px-0 pb-12">
            <CatalogHeader
                search={search}
                onChange={updateSearchText}
                range={range}
                onRangeChange={setRange}
                onAddNew={handleOpenAdd}
            />

            <CatalogTable
                items={items}
                isLoading={isLoading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={(p, ps) => {
                    setPage(p);
                    setPageSize(ps);
                }}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            <CatalogFormModal
                open={isModalOpen}
                onClose={handleClose}
                onSubmit={() => formik.submitForm()}
                isSubmitting={isSubmitting}
                editingItem={editingItem}
                formik={formik}
            />
        </Content>
    );
};

export default ProductCatalog;
