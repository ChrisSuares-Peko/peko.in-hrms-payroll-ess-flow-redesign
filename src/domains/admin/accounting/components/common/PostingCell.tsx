import { Flex, Tooltip, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { GenericColumn } from '@components/atomic/GenericTable';

import { Posting, PostingState } from '../../types/posting';

const POSTING_LABELS: Record<PostingState, { label: string; className: string }> = {
    posted: { label: 'Posted', className: 'text-green-700' },
    notPosted: { label: 'Not posted', className: 'text-amber-700' },
    notApplicable: { label: 'Not applicable', className: 'text-muted' },
};

const PostingLines = ({ posting, to }: { posting: Posting; to?: string | null }) => {
    const { label, className } = POSTING_LABELS[posting.state];
    return (
        <>
            {to && posting.state === 'notPosted' ? (
                <Link to={to} className={`${className} underline`}>
                    {label}
                </Link>
            ) : (
                <Typography.Text className={className}>{label}</Typography.Text>
            )}
            {posting.note && (
                <Typography.Text className="text-xs text-muted">{posting.note}</Typography.Text>
            )}
        </>
    );
};

const PostingCell = ({ posting, to }: { posting?: Posting | null; to?: string | null }) => {
    if (!posting || !POSTING_LABELS[posting.state]) return null;
    if (!posting.detail) {
        return (
            <Flex vertical>
                <PostingLines posting={posting} to={to} />
            </Flex>
        );
    }
    return (
        <Tooltip title={posting.detail} trigger={['hover', 'focus']}>
            <Flex vertical tabIndex={0} className="w-fit cursor-help">
                <PostingLines posting={posting} to={to} />
            </Flex>
        </Tooltip>
    );
};

type PostingColumnOptions<T> = { linkTo?: (row: T) => string | null };

export const postingColumn = <T extends { posting?: Posting | null }>(
    options: PostingColumnOptions<T> = {}
): GenericColumn<T> => ({
    title: 'Posted',
    key: 'posting',
    width: 160,
    render: (_: unknown, row: T) => (
        <PostingCell posting={row.posting} to={options.linkTo ? options.linkTo(row) : null} />
    ),
});

export default PostingCell;
