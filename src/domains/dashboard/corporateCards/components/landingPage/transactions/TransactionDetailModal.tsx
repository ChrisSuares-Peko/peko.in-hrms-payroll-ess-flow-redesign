import { useState } from 'react';
import type { ReactNode } from 'react';

import {
    CreditCardOutlined,
    DeleteOutlined,
    FileTextOutlined,
    ShopOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Button, Input, Modal, Segmented, Skeleton, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { TxnStatusTag } from './TransactionStatusTag';
import exportIcon from '../../../assets/icons/export.svg';
import fileIcon from '../../../assets/icons/file.svg';
import { useTransactionCommentsApi } from '../../../hooks/user/useTransactionCommentsApi';
import { useTransactionDetailApi } from '../../../hooks/user/useTransactionDetailApi';
import { useTransactionReceiptsApi } from '../../../hooks/user/useTransactionReceiptsApi';
import { cn } from '../../../utils/cn';
import { ReceiptFile, TransactionRow } from '../../../utils/types';
import {
    MODAL_CLOSE_ICON,
    PineLabsFooter,
    ROUNDED_MODAL_CLASSNAMES,
} from '../../common/modalProps';

const { Text } = Typography;
const { TextArea } = Input;

const ACCEPTED = '.pdf,.png,.jpg,.jpeg';
const MAX_RECEIPT_SIZE_MB = 5;
const RECEIPT_SIZE_HINT = `PDF, JPG, PNG · Max ${MAX_RECEIPT_SIZE_MB} MB`;
const commentSpacingError = (value: string): string | null => {
    if (!value) return null;
    if (/^\s/.test(value)) return 'Comment cannot start with a space';
    if (/\s$/.test(value)) return 'Comment cannot end with a space';
    if (/\s{2,}/.test(value)) return 'Comment cannot contain consecutive spaces';
    return null;
};

interface TransactionDetailModalProps {
    transaction: TransactionRow | null;
    onClose: () => void;
    variant?: 'admin' | 'user';
}

const fmtAmount = (n: number) =>
    `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InfoRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div className="flex items-start justify-between gap-3">
        <Text className="shrink-0 text-sm text-textBody">{label}</Text>
        <Text
            className={cn(
                'min-w-0 break-words text-right text-sm text-textHeadings',
                bold && 'font-semibold'
            )}
        >
            {value}
        </Text>
    </div>
);

const SectionCard = ({
    icon,
    title,
    fields,
}: {
    icon: ReactNode;
    title: string;
    fields: { label: string; value: string }[];
}) => (
    <div className="flex flex-col gap-3 rounded-xl border border-borderCard p-4">
        <div className="flex items-center gap-2">
            {icon}
            <Text className="text-sm font-semibold text-textHeadings">{title}</Text>
        </div>
        {fields.map(f => (
            <InfoRow key={f.label} label={f.label} value={f.value} />
        ))}
    </div>
);

const TransactionDetailModal = ({
    transaction,
    onClose,
    variant = 'user',
}: TransactionDetailModalProps) => {
    const isAdmin = variant === 'admin';
    const dispatch = useAppDispatch();

    const [tab, setTab] = useState('overview');
    const [comment, setComment] = useState('');
    const [adminComment, setAdminComment] = useState('');
    const commentError = commentSpacingError(comment);
    const adminCommentError = commentSpacingError(adminComment);
    const uploadAs: 'ADMIN' | 'CARDHOLDER' = isAdmin ? 'ADMIN' : 'CARDHOLDER';
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const { detail, isLoading } = useTransactionDetailApi(transaction?.key ?? null);
    const {
        comments,
        isLoading: commentsLoading,
        isPosting,
        post,
    } = useTransactionCommentsApi(transaction?.key ?? null);
    const {
        receipts,
        isLoading: receiptsLoading,
        isUploading,
        upload,
        deleteReceipt,
    } = useTransactionReceiptsApi(transaction?.key ?? null);

    const amount = transaction?.amount ?? 0;
    const formatted = fmtAmount(amount);

    const apiCardholder = detail?.sections.find(s => s.title === 'Cardholder Details')?.fields;
    const cardholderFields = apiCardholder ?? [
        { label: 'Name', value: transaction?.member || '—' },
        { label: 'Email', value: '—' },
        { label: 'Role', value: '—' },
        { label: 'Team', value: '—' },
    ];
    const cardName =
        cardholderFields.find(f => f.label === 'Name')?.value || transaction?.member || '—';
    const cardFields = [
        { label: 'Card Name', value: cardName },
        { label: 'Card Number', value: detail?.maskedCardNumber ?? transaction?.cardLast4 ?? '—' },
    ];
    const paymentFields = [
        { label: 'Type', value: 'Card purchase' },
        { label: 'Currency', value: 'INR' },
        { label: 'Country', value: 'India' },
        { label: 'International', value: 'No' },
    ];
    const merchantName = detail?.merchantName ?? transaction?.merchant ?? '—';
    const apiTxnSection = detail?.sections.find(s => s.title === 'Transaction Details')?.fields;
    const merchantFields = [
        { label: 'Name', value: merchantName },
        { label: 'City', value: apiTxnSection?.find(f => f.label === 'City')?.value ?? '—' },
        {
            label: 'Category',
            value:
                apiTxnSection?.find(f => f.label === 'Category')?.value ??
                transaction?.category ??
                '—',
        },
    ];

    const receiptColumns: ColumnsType<ReceiptFile> = [
        {
            key: 'file',
            title: 'File',
            dataIndex: 'fileName',
            render: (fileName: string, row) => (
                <div className="flex items-center gap-2">
                    <img src={fileIcon} alt="" className="h-4 w-4 shrink-0" />
                    {row.url ? (
                        <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-textHeadings hover:underline"
                        >
                            {fileName}
                        </a>
                    ) : (
                        <Text className="text-sm text-textHeadings">{fileName}</Text>
                    )}
                </div>
            ),
        },
        {
            key: 'date',
            title: 'Date',
            dataIndex: 'date',
            render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
        },
        {
            key: 'uploadedBy',
            title: 'Uploaded by',
            dataIndex: 'uploadedBy',
            render: (v: string) => <Text className="text-sm text-textBody">{v}</Text>,
        },
        {
            key: 'delete',
            title: '',
            width: 56,
            render: (_, row) => {
                const canDelete = isAdmin || row.uploadedBy === 'Cardholder';
                if (!canDelete) return null;
                return (
                    <Button
                        type="text"
                        danger
                        aria-label="Delete receipt"
                        icon={<DeleteOutlined />}
                        loading={deletingId === row.id}
                        onClick={async () => {
                            setDeletingId(row.id as number);
                            await deleteReceipt(row.id as number);
                            setDeletingId(null);
                        }}
                    />
                );
            },
        },
    ];

    return (
        <Modal
            open={transaction !== null}
            onCancel={onClose}
            footer={null}
            closeIcon={MODAL_CLOSE_ICON}
            classNames={ROUNDED_MODAL_CLASSNAMES}
            width={700}
            destroyOnHidden
        >
            <div className="mt-7 flex items-start justify-between gap-3">
                <Text className="min-w-0 break-words text-xl font-semibold text-textHeadings">
                    {detail?.merchantName ?? transaction?.merchant ?? '—'}
                </Text>
                <Text className="shrink-0 text-xl font-semibold text-textHeadings">
                    {formatted}
                </Text>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <Text className="min-w-0 break-words text-sm text-textBody">
                    {transaction?.date}
                    {transaction?.transactionId ? ` · ${transaction.transactionId}` : ''}
                    {transaction?.category ? ` · ${transaction.category}` : ''}
                </Text>
                {transaction?.status && (
                    <span className="shrink-0">
                        <TxnStatusTag status={transaction.status} />
                    </span>
                )}
            </div>

            <Segmented
                value={tab}
                onChange={val => setTab(val as string)}
                block
                options={[
                    { label: 'Overview', value: 'overview' },
                    { label: 'Receipts', value: 'receipts' },
                    { label: 'Comments', value: 'comments' },
                ]}
                className="mt-4 mb-5 [&_.ant-segmented-item]:!rounded-full [&_.ant-segmented-thumb]:!rounded-full [&_.ant-segmented-item-selected]:!text-textLightRed"
                style={{ borderRadius: 9999, padding: '4px' }}
            />

            {tab === 'overview' && (
                <Skeleton active loading={isLoading} paragraph={{ rows: 8 }}>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <SectionCard
                                icon={<UserOutlined className="text-sm text-textGreyLight" />}
                                title="Cardholder Details"
                                fields={cardholderFields}
                            />
                            <SectionCard
                                icon={<CreditCardOutlined className="text-sm text-textGreyLight" />}
                                title="Card Details"
                                fields={cardFields}
                            />
                            <SectionCard
                                icon={<FileTextOutlined className="text-sm text-textGreyLight" />}
                                title="Payment Details"
                                fields={paymentFields}
                            />
                            <SectionCard
                                icon={<ShopOutlined className="text-sm text-textGreyLight" />}
                                title="Merchant"
                                fields={merchantFields}
                            />
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl border border-borderCard p-4">
                            <Text className="text-sm font-semibold text-textHeadings">
                                Transaction Details
                            </Text>
                            <InfoRow
                                label="Transaction amount"
                                value={detail?.transactionAmount ?? formatted}
                            />
                            <InfoRow
                                label="International fee"
                                value={detail?.internationalFee ?? '₹0.00'}
                            />
                            <div className="border-t border-borderDivider pt-2">
                                <InfoRow
                                    label="Total charged"
                                    value={detail?.totalCharged ?? formatted}
                                    bold
                                />
                            </div>
                        </div>
                    </div>
                </Skeleton>
            )}

            {tab === 'receipts' && (
                <div className="flex flex-col gap-4 rounded-2xl border border-borderCard p-5">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                            <Upload
                                accept={ACCEPTED}
                                showUploadList={false}
                                beforeUpload={file => {
                                    if (file.size / 1024 / 1024 > MAX_RECEIPT_SIZE_MB) {
                                        dispatch(
                                            showToast({
                                                variant: 'error',
                                                description: `File size must not exceed ${MAX_RECEIPT_SIZE_MB} MB`,
                                            })
                                        );
                                        return false;
                                    }
                                    upload(file, uploadAs);
                                    return false;
                                }}
                            >
                                <Button
                                    danger
                                    loading={isUploading}
                                    icon={<img src={exportIcon} alt="" className="h-4 w-4" />}
                                >
                                    Upload receipt
                                </Button>
                            </Upload>
                        </div>
                        <Text className="text-xs text-textGreyLight">{RECEIPT_SIZE_HINT}</Text>
                    </div>
                    <Skeleton active loading={receiptsLoading} paragraph={{ rows: 3 }}>
                        <div className="[&>div:first-child]:!mb-0">
                            <GenericTable
                                columns={receiptColumns}
                                dataSource={receipts}
                                rowKey="key"
                            />
                        </div>
                    </Skeleton>
                </div>
            )}

            {tab === 'comments' && (
                <div className="flex flex-col gap-4">
                    {isAdmin ? (
                        <div className="flex flex-col gap-2">
                            <Text className="text-sm text-textBody">Admin comment</Text>
                            <TextArea
                                rows={3}
                                placeholder="Enter"
                                value={adminComment}
                                onChange={e => setAdminComment(e.target.value)}
                                maxLength={2000}
                                showCount
                                status={adminCommentError ? 'error' : ''}
                            />
                            {adminCommentError && (
                                <Text className="text-xs text-errorTextRed">
                                    {adminCommentError}
                                </Text>
                            )}
                            <Button
                                danger
                                loading={isPosting}
                                disabled={!adminComment.trim() || !!adminCommentError}
                                className="mt-1 self-start"
                                onClick={async () => {
                                    const ok = await post(adminComment, 'ADMIN');
                                    if (ok) setAdminComment('');
                                }}
                            >
                                Post as admin
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Text className="text-sm text-textBody">Comment</Text>
                            <TextArea
                                rows={3}
                                placeholder="Enter"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                maxLength={2000}
                                showCount
                                status={commentError ? 'error' : ''}
                            />
                            {commentError && (
                                <Text className="text-xs text-errorTextRed">{commentError}</Text>
                            )}
                            <Button
                                danger
                                loading={isPosting}
                                disabled={!comment.trim() || !!commentError}
                                className="mt-1 self-start"
                                onClick={async () => {
                                    const ok = await post(comment);
                                    if (ok) setComment('');
                                }}
                            >
                                Post a comment
                            </Button>
                        </div>
                    )}

                    {(commentsLoading || comments.length > 0) && (
                        <>
                            <div className="border-t border-borderDivider" />
                            <Skeleton active loading={commentsLoading} paragraph={{ rows: 3 }}>
                                <div className="flex flex-col gap-3">
                                    {comments.map(c => (
                                        <div
                                            key={c.key}
                                            className="flex flex-col gap-1 rounded-xl px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                                            style={{ background: '#F5F5F5' }}
                                        >
                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                <Text className="text-sm font-semibold text-textHeadings">
                                                    {c.author}
                                                </Text>
                                                <Text className="whitespace-pre-line break-words text-sm text-textBody">
                                                    {c.message}
                                                </Text>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Text className="text-sm text-textBody">
                                                    {c.role === 'admin' ? 'Admin' : 'Cardholder'}
                                                </Text>
                                                <Text className="text-xs text-textGreyLight">
                                                    {c.timestamp}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Skeleton>
                        </>
                    )}
                </div>
            )}

            <div className="mt-6">
                <PineLabsFooter />
            </div>
        </Modal>
    );
};

export default TransactionDetailModal;
