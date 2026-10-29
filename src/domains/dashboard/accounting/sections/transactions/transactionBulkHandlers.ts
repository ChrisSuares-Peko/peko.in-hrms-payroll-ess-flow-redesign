import {
    toggleTransactionHidden,
    toggleTransactionRecurring,
    updateTransactionCategory,
} from '../../api/transactions';

type RunBulk = (perId: (id: string) => Promise<unknown>, verb: string) => Promise<void>;

interface BulkHandlerDeps {
    userId: number;
    userType: string;
    runBulk: RunBulk;
    activeTab: string;
}

export const buildBulkHandlers = ({ userId, userType, runBulk, activeTab }: BulkHandlerDeps) => {
    const bulkHideTo = activeTab !== 'hidden';
    const hideLabel = bulkHideTo ? 'Hide' : 'Unhide';

    const handleBulkHide = () =>
        runBulk(
            id =>
                toggleTransactionHidden({
                    userId,
                    userType,
                    transactionId: id,
                    isHidden: bulkHideTo,
                }),
            bulkHideTo ? 'hidden' : 'unhidden'
        );

    const handleBulkRecurring = (isRecurring: boolean) =>
        runBulk(
            id =>
                toggleTransactionRecurring({
                    userId,
                    userType,
                    transactionId: id,
                    isRecurring,
                }),
            isRecurring ? 'marked as recurring' : 'marked as non-recurring'
        );

    const handleBulkCategorize = (category: string) =>
        runBulk(
            id =>
                updateTransactionCategory({
                    userId,
                    userType,
                    transactionId: id,
                    category,
                    reviewed: true,
                }),
            `categorized as ${category}`
        );

    return {
        hideLabel,
        handleBulkHide,
        handleBulkRecurring,
        handleBulkCategorize,
    };
};
