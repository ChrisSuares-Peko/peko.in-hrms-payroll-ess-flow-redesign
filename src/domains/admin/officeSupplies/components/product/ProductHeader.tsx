import { Suspense, lazy, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType, DropDown } from '@customtypes/general';
import useExcelDownaload from '@domains/admin/manage/hooks/common/useExcelDownaload';

import { NewProduct, refresh, Vendor } from '../../types/products';

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
    downloadReport: (type: string) => void;
    accessPermission: any;
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
    downloadReport,
    accessPermission,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
    const [openBulkModal, setOpenBulkModal] = useState(false);
    useExcelDownaload();
    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3">
                <Button danger onClick={() => downloadReport(DownloadType.Excel)}>
                    Excel
                </Button>
                <Button danger onClick={() => downloadReport(DownloadType.Csv)}>
                    CSV
                </Button>
                <Button danger onClick={() => downloadReport(DownloadType.Pdf)}>
                    PDF
                </Button>
            </Flex>
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                {accessPermission && accessPermission.write && (
                    <>
                        <Button
                            type="primary"
                            className="w-full sm:w-fit"
                            danger
                            onClick={() => setOpenModal(true)}
                        >
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
                    </>
                )}
                {/* <Button
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    loading={excelLoading}
                    onClick={() =>
                        downloadExcelFile('/purchase/products/excel-report', 'Products Excel')
                    }
                >
                    Download Excel
                </Button> */}

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
