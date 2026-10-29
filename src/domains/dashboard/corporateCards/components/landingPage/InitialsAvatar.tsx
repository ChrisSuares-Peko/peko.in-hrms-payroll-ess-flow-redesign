import { Avatar } from 'antd';

import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/helpers';

type AvatarTone = 'rose' | 'neutral';

interface InitialsAvatarProps {
    name: string;
    /** Pixel diameter; defaults to a comfortable row size. */
    size?: number;
    /** rose → member rows, neutral → team rosters. */
    tone?: AvatarTone;
    className?: string;
}

const TONE: Record<AvatarTone, string> = {
    rose: '!bg-bgLightPink !text-textLightRed',
    neutral: '!bg-listBg !text-textHeadings',
};

/** Circular initials avatar (antd Avatar) used across the People page. */
const InitialsAvatar = ({ name, size = 40, tone = 'rose', className }: InitialsAvatarProps) => (
    <Avatar
        size={size}
        className={cn('shrink-0 font-medium', TONE[tone], className)}
        style={{ fontSize: Math.round(size * 0.36) }}
    >
        {getInitials(name)}
    </Avatar>
);

export default InitialsAvatar;
