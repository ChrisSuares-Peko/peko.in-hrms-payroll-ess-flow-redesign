import { Button, Input, Typography } from 'antd';

import sendIcon from '../../../assets/icons/send.svg';
import { cn } from '../../../utils/cn';
import { COMMENTS } from '../../../utils/transactionsData';
import SectionCard from '../../common/SectionCard';

const { Text } = Typography;

/** Transaction-detail "Comments" panel: a chat-style thread plus an add-comment input. */
const CommentsPanel = () => (
    <SectionCard title="Comments">
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                {COMMENTS.map(comment => (
                    <div
                        key={comment.key}
                        className={cn(
                            'max-w-[85%] rounded-lg px-4 py-2',
                            comment.role === 'admin'
                                ? 'self-end bg-bgLightPink'
                                : 'self-start bg-bgLightGray'
                        )}
                    >
                        <Text className="text-sm text-textHeadings">{comment.message}</Text>{' '}
                        <Text className="text-xs text-textGreyLight">
                            {comment.author} · {comment.timestamp}
                        </Text>
                    </div>
                ))}
            </div>

            <Input
                placeholder="Add a comment"
                suffix={
                    <Button
                        type="text"
                        aria-label="Send comment"
                        icon={<img src={sendIcon} alt="send" className="h-5 w-5" />}
                    />
                }
            />
        </div>
    </SectionCard>
);

export default CommentsPanel;
