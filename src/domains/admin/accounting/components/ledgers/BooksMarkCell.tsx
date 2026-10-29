import { ReactNode } from 'react';

import { Button, Flex, Switch, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import { LedgerBooksMark } from '../../types/ledgerBooks';
import StatusPill from '../common/StatusPill';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

export const BOOKS_COLUMN_TITLE = 'In Books';

export const REMOVE_FROM_PORTAL_TEXT =
    'Do this only once the entry has been taken out of the books. Once confirmed, the record will be gone from the portal.';

type BooksMarkCellProps = {
    entry: LedgerBooksMark;
    label: string;
    canUpdate?: boolean;
    busy?: boolean;
    onMark?: (synced: boolean) => void;
};

const markedBy = (entry: LedgerBooksMark) => {
    const when = entry.booksSyncedAt
        ? ` on ${dayjs(entry.booksSyncedAt).format('DD MMM YYYY')}`
        : '';
    return entry.booksSyncedByName
        ? `Marked by ${entry.booksSyncedByName}${when}`
        : 'Marked as in the books';
};

const BooksMarkCell = ({
    entry,
    label,
    canUpdate = false,
    busy = false,
    onMark,
}: BooksMarkCellProps) => {
    if (entry.booksSynced === undefined && !entry.deleted)
        return <Typography.Text>—</Typography.Text>;
    const editable = canUpdate && Boolean(onMark);

    if (entry.deleted) {
        return (
            <Flex vertical gap={4} align="flex-start">
                <StatusPill label="Still in books" tone="danger" />
                <Tooltip title={editable ? '' : NO_PERMISSION}>
                    <Button
                        size="small"
                        danger
                        disabled={!editable}
                        loading={busy}
                        aria-label={`Mark ${label} removed from the books`}
                        onClick={() => onMark?.(true)}
                    >
                        Mark removed
                    </Button>
                </Tooltip>
            </Flex>
        );
    }

    const synced = Boolean(entry.booksSynced);
    let hint = NO_PERMISSION;
    if (synced) hint = markedBy(entry);
    else if (editable) hint = 'Turn on once it is entered in the books';

    return (
        <Tooltip title={hint}>
            <Switch
                size="small"
                checked={synced}
                disabled={!editable}
                loading={busy}
                checkedChildren="Synced"
                unCheckedChildren="Not synced"
                aria-label={`${label} is in the books`}
                onChange={checked => onMark?.(checked)}
            />
        </Tooltip>
    );
};

export const readOnlyBooks = (row: LedgerBooksMark) => <BooksMarkCell entry={row} label="" />;

export const booksColumn = <T extends LedgerBooksMark>(
    render: (row: T) => ReactNode,
    pinned = true,
    width = 140
) => ({
    title: BOOKS_COLUMN_TITLE,
    key: 'books',
    width,
    neverFold: pinned,
    render: (_: unknown, row: T) => render(row),
});

export default BooksMarkCell;
