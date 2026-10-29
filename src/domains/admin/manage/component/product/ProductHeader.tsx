import { Suspense, lazy, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DropDown } from '@customtypes/general';

import { NewProduct, refresh } from '../../types/products';
import { Vendor } from '../../types/serviceOperator';

const BulkUploadModal = lazy(() => import('./bulkUpload/BulkUploadModal'));
const ProductModal = lazy(() => import('./ProductModal'));

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    categoryData: DropDown | undefined;
    vendorData: DropDown | undefined;
    allVendors: Vendor[] | undefined;
    createProducts: (val: NewProduct) => Promise<boolean>;
    updateProducts: (val: NewProduct) => Promise<boolean>;
};

const ProductHeader = ({
    searchText,
    handleSearch,
    categoryData,
    updateProducts,
    vendorData,
    createProducts,
    allVendors,
    setRefresh,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
    const [openBulkModal, setOpenBulkModal] = useState(false);

    return (
        <Row className="w-full gap-5" justify="end">
            {/* <Col xs={24} sm={12} md={10}>
                <Typography.Paragraph className="hidden">download excel</Typography.Paragraph>
            </Col> */}
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                <Button type="primary" className="w-full" danger onClick={() => setOpenModal(true)}>
                    Add New Product
                </Button>
                <Button
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    onClick={() => setOpenBulkModal(true)}
                >
                    Bulk Upload
                </Button>
                <Input
                    value={searchText}
                    placeholder="Search "
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>

            <Suspense>
                {openModal && (
                    <ProductModal
                        createProducts={createProducts}
                        allVendors={allVendors}
                        categoryData={categoryData}
                        updateProducts={updateProducts}
                        vendorData={vendorData}
                        open={openModal}
                        handleCancel={() => setOpenModal(false)}
                        setRefresh={setRefresh}
                    />
                )}
                {openBulkModal && (
                    <BulkUploadModal
                        open={openBulkModal}
                        handleCancel={() => setOpenBulkModal(false)}
                    />
                )}
            </Suspense>
        </Row>
    );
};
export default ProductHeader;
