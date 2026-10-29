import { SyncOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Select, Typography } from 'antd';

import AmountText from './AmountText';
import CategoryTag from './CategoryTag';
import DocsCell from './DocsCell';
import NoteEditor from './NoteEditor';
import RowActions from './RowActions';
import { useAccountSelect } from './useAccountSelect';
import { accountOptions, Transaction, TRANSACTION_GRID_COLS } from '../../utils/transactionsData';

const { Text } = Typography;

interface TransactionRowProps {
    transaction: Transaction;
    selected: boolean;
    editing: boolean;
    hidden: boolean;
    onToggleSelect: () => void;
    onStartEdit: () => void;
    onStopEdit: () => void;
    onSaveNote: (note: string) => void;
    onToggleRecurring: () => void;
    onToggleHide: () => void;
    onAcceptCategory?: () => void;
    onChangeCategory: (category: string) => void;

    onChangeAccount: (account: string) => Promise<boolean>;
    onLinkDocument?: () => void;
    onUnlink: (linkId: number) => void;
    onRemoveDoc: (documentId: number) => void;
}

const TransactionRow = ({
    transaction,
    selected,
    editing,
    hidden,
    onToggleSelect,
    onStartEdit,
    onStopEdit,
    onSaveNote,
    onToggleRecurring,
    onToggleHide,
    onAcceptCategory,
    onChangeCategory,
    onChangeAccount,
    onLinkDocument,
    onUnlink,
    onRemoveDoc,
}: TransactionRowProps) => {
    const { account, handleAccountChange } = useAccountSelect(transaction.account, onChangeAccount);

    const recurringOrNote = (transaction.recurring || transaction.note) && (
        <Flex align="center" gap={16} wrap="wrap">
            {transaction.recurring && (
                <Flex align="center" gap={6} className="text-warning">
                    <SyncOutlined className="text-xs" />
                    <Text className="text-xs font-medium text-warning">Recurring</Text>
                </Flex>
            )}
            {transaction.note && (
                <Button
                    type="link"
                    onClick={onStartEdit}
                    className="!h-auto !p-0 !text-xs !font-medium !text-danger !underline !underline-offset-2 hover:!opacity-80"
                >
                    View note
                </Button>
            )}
        </Flex>
    );

    return (
        <>
            {/* Desktop/tablet: fixed-column grid row. */}
            <div
                className={`hidden ${TRANSACTION_GRID_COLS} items-center gap-x-4 border-b border-slate-100 px-6 py-5 transition-opacity last:border-b-0 lg:grid ${
                    hidden ? 'opacity-50' : ''
                }`}
            >
                <Checkbox checked={selected} onChange={onToggleSelect} />

                <Text className="text-sm text-bodyText">{transaction.date}</Text>

                <Flex vertical gap={10} className="min-w-0 self-start pr-2">
                    <Text className="text-sm font-medium text-ink xxl:text-base">
                        {transaction.description}
                    </Text>

                    {editing ? (
                        <NoteEditor
                            initialValue={transaction.note}
                            onSave={onSaveNote}
                            onCancel={onStopEdit}
                        />
                    ) : (
                        recurringOrNote
                    )}
                </Flex>

                <CategoryTag
                    category={transaction.category}
                    onAccept={onAcceptCategory}
                    onSelect={onChangeCategory}
                />

                <AmountText amount={transaction.amount} type={transaction.type} />

                <Text className="text-sm text-bodyText">{transaction.type}</Text>

                <Select
                    value={account}
                    onChange={handleAccountChange}
                    options={accountOptions}
                    size="middle"
                    className="w-full"
                />

                <DocsCell
                    links={transaction.links}
                    documents={transaction.documents}
                    onView={onLinkDocument}
                    onAttach={onLinkDocument}
                    onUnlink={onUnlink}
                    onRemoveDoc={onRemoveDoc}
                />

                <RowActions
                    isHidden={hidden}
                    onEdit={onStartEdit}
                    onAttach={onLinkDocument}
                    onRecurring={onToggleRecurring}
                    onToggleHide={onToggleHide}
                />
            </div>

            {/* Mobile/narrow-tablet: stacked card. */}
            <Flex
                vertical
                gap={12}
                className={`border-b border-slate-100 p-4 transition-opacity last:border-b-0 lg:hidden ${
                    hidden ? 'opacity-50' : ''
                }`}
            >
                <Flex align="flex-start" justify="space-between" gap={12}>
                    <Flex align="flex-start" gap={10} className="min-w-0">
                        <Checkbox checked={selected} onChange={onToggleSelect} className="mt-1" />
                        <Flex vertical gap={2} className="min-w-0">
                            <Text className="text-sm font-semibold text-ink">
                                {transaction.description}
                            </Text>
                            <Text className="text-xs text-bodyText">{transaction.date}</Text>
                        </Flex>
                    </Flex>
                    <div className="shrink-0 whitespace-nowrap">
                        <AmountText amount={transaction.amount} type={transaction.type} />
                    </div>
                </Flex>

                {editing ? (
                    <NoteEditor
                        initialValue={transaction.note}
                        onSave={onSaveNote}
                        onCancel={onStopEdit}
                    />
                ) : (
                    recurringOrNote
                )}

                <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                    <CategoryTag
                        category={transaction.category}
                        onAccept={onAcceptCategory}
                        onSelect={onChangeCategory}
                    />
                    <Text className="text-sm text-bodyText">{transaction.type}</Text>
                </Flex>

                <Select
                    value={account}
                    onChange={handleAccountChange}
                    options={accountOptions}
                    size="middle"
                    className="w-full"
                />

                <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                    <DocsCell
                        links={transaction.links}
                        documents={transaction.documents}
                        onView={onLinkDocument}
                        onAttach={onLinkDocument}
                        onUnlink={onUnlink}
                        onRemoveDoc={onRemoveDoc}
                    />

                    <RowActions
                        isHidden={hidden}
                        onEdit={onStartEdit}
                        onAttach={onLinkDocument}
                        onRecurring={onToggleRecurring}
                        onToggleHide={onToggleHide}
                    />
                </Flex>
            </Flex>
        </>
    );
};

export default TransactionRow;
