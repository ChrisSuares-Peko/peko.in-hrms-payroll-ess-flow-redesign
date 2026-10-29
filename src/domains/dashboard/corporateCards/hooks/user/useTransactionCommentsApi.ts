import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { formattedDateTime } from '@utils/dateFormat';

import {
    CommentApiItem,
    getTransactionComments,
    postTransactionComment,
} from '../../api/user/transactionsApi';
import { CommentEntry } from '../../utils/types';

const toEntry = (c: CommentApiItem): CommentEntry => ({
    key: `comment-${c.id}`,
    author: c.authorName || 'Unknown',
    role: c.authorRole?.toLowerCase().includes('admin') ? 'admin' : 'user',
    message: c.message,
    timestamp: c.createdAt ? formattedDateTime(new Date(c.createdAt)) : '',
});

export const useTransactionCommentsApi = (transactionId: string | null) => {
    const { role, id, roleName } = useAppSelector(state => state.reducer.auth);
    const [comments, setComments] = useState<CommentEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    const fetchComments = useCallback(async () => {
        if (!transactionId) return;
        setIsLoading(true);
        const res = await getTransactionComments(role, id, transactionId);
        if (res && res.data?.comments) {
            setComments(res.data.comments.map(toEntry));
        }
        setIsLoading(false);
    }, [role, id, transactionId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const apiRole: 'ADMIN' | 'CARDHOLDER' = roleName?.toLowerCase().includes('admin')
        ? 'ADMIN'
        : 'CARDHOLDER';

    const post = async (message: string, postAs?: 'ADMIN' | 'CARDHOLDER'): Promise<boolean> => {
        if (!transactionId || !message.trim()) return false;
        setIsPosting(true);
        const res = await postTransactionComment(
            role,
            id,
            transactionId,
            message.trim(),
            postAs ?? apiRole
        );
        if (res) {
            await fetchComments();
        }
        setIsPosting(false);
        return !!res;
    };

    return { comments, isLoading, isPosting, post };
};
