import { useState, Suspense, lazy } from 'react';

import { Alert, Button, Flex, Skeleton } from 'antd';

import AddBiller from '../components/AddBiller';
import BillerList from '../components/BillerList';
import { useBillerPreview } from '../hooks/useBillerPreview';
import { useBillers } from '../hooks/useBillers';
import { Biller, AddBillerPayload } from '../types/billers';

const PreviewModal = lazy(() => import('../components/PreviewModal'));

const BillerManagement = () => {
    const {
        isLoading,
        isRefreshing,
        isExporting,
        data,
        fetchError,
        categories,
        refreshProgress,
        retry,
        handleAddBiller,
        handleRemoveBiller,
        handleDisableBiller,
        handleEnableBiller,
        handleBulkUpload,
        handleTableChange,
        handleRefresh,
        handleUpdateBillerName,
        handleExportFetchLogs,
    } = useBillers();

    const { previewData, previewFromExcel, clearPreview, isLoading: isPreviewLoading } = useBillerPreview();

    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    const handleExcelUpload = async (file: File) => {
        const result = await previewFromExcel(file);
        if (result) {
            setPreviewModalOpen(true);
        }
    };

    const handlePreviewConfirm = async (selectedBillers: Biller[]) => {
        const success = await handleBulkUpload({ selectedBillers });
        if (success) {
            setPreviewModalOpen(false);
            clearPreview();
        }
        return success;
    };

    const handleAdd = async (payload: AddBillerPayload) => handleAddBiller(payload);

    if (!data) {
        if (fetchError) {
            return (
                <Alert
                    message="Failed to load billers"
                    description="Something went wrong while fetching biller data. Please try again."
                    type="error"
                    showIcon
                    action={<Button size="small" onClick={() => retry()}>Retry</Button>}
                />
            );
        }
        return <Skeleton active />;
    }

    return (
        <Flex vertical gap={20}>
            <AddBiller
                onAdd={handleAdd}
                onExcelUpload={handleExcelUpload}
                isLoading={isLoading}
            />

            <BillerList
                billers={data.billers}
                total={data.total}
                activeCount={data.activeCount}
                disabledCount={data.disabledCount}
                lastUpdated={data.lastUpdated}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                isExporting={isExporting}
                refreshProgress={refreshProgress}
                categories={categories}
                onEnable={handleEnableBiller}
                onDisable={handleDisableBiller}
                onRemove={handleRemoveBiller}
                onTableChange={handleTableChange}
                onRefresh={handleRefresh}
                onUpdateName={handleUpdateBillerName}
                onExportFetchLogs={handleExportFetchLogs}
            />

            <Suspense fallback={null}>
                {previewModalOpen && previewData && (
                    <PreviewModal
                        open={previewModalOpen}
                        onCancel={() => {
                            setPreviewModalOpen(false);
                            clearPreview();
                        }}
                        previewData={previewData.preview || []}
                        totalCount={previewData.totalCount || 0}
                        onConfirm={handlePreviewConfirm}
                        isLoading={isLoading || isPreviewLoading}
                    />
                )}
            </Suspense>
        </Flex>
    );
};

export default BillerManagement;
