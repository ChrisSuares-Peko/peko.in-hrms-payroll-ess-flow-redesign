import {
    deleteTransactionDocument,
    deleteTransactionLink,
    toggleTransactionHidden,
    toggleTransactionRecurring,
    updateTransactionAccount,
    updateTransactionCategory,
    updateTransactionNote,
} from '../../api/transactions';

type RunAction = (action: () => Promise<boolean>, successMsg: string) => Promise<boolean>;

interface RowHandlerDeps {
    userId: number;
    userType: string;
    runAction: RunAction;
    setEditingId: (id: string | null) => void;
}

export const buildRowHandlers = ({ userId, userType, runAction, setEditingId }: RowHandlerDeps) => {
    const handleSaveNote = (id: string, note: string) =>
        runAction(
            () =>
                updateTransactionNote({ userId, userType, transactionId: id, note }).then(Boolean),
            'Note saved successfully'
        ).then(ok => {
            if (ok) setEditingId(null);
        });

    const handleToggleRecurring = (id: string, current: boolean) =>
        runAction(
            () =>
                toggleTransactionRecurring({
                    userId,
                    userType,
                    transactionId: id,
                    isRecurring: !current,
                }).then(Boolean),
            current ? 'Recurring removed successfully' : 'Marked as recurring'
        );

    const handleToggleHide = (id: string, current: boolean) =>
        runAction(
            () =>
                toggleTransactionHidden({
                    userId,
                    userType,
                    transactionId: id,
                    isHidden: !current,
                }).then(Boolean),
            current ? 'Transaction unhidden successfully' : 'Transaction hidden'
        );

    const handleSetCategory = (id: string, category: string) =>
        runAction(
            () =>
                updateTransactionCategory({
                    userId,
                    userType,
                    transactionId: id,
                    category,
                    reviewed: true,
                }).then(Boolean),
            'Category updated successfully'
        );

    const handleChangeAccount = (id: string, account: string) =>
        runAction(
            () =>
                updateTransactionAccount({
                    userId,
                    userType,
                    transactionId: id,
                    account,
                }).then(Boolean),
            'Account updated successfully'
        );

    const handleUnlink = (id: string, linkId: number) =>
        runAction(
            () => deleteTransactionLink({ userId, userType, transactionId: id, linkId }),
            'Invoice unlinked successfully'
        );

    const handleRemoveDoc = (id: string, documentId: number) =>
        runAction(
            () => deleteTransactionDocument({ userId, userType, transactionId: id, documentId }),
            'Document removed successfully'
        );

    return {
        handleSaveNote,
        handleToggleRecurring,
        handleToggleHide,
        handleSetCategory,
        handleChangeAccount,
        handleRemoveDoc,
        handleUnlink,
    };
};
