/* eslint-disable react/prop-types */
import React from 'react';

import { Popover } from 'antd';
import { ReactSVG } from 'react-svg';

import Smile from '@domains/dashboard/pekoConnect/assets/EmojiIcon.svg';

import EmojiPicker from './EmojiPicker';

type EmojiPanelProps = {
    onEmojiClick: (emoji: any) => void;
};

const EmojiPanel: React.FC<EmojiPanelProps> = React.memo(({ onEmojiClick }) => (
    <Popover
        placement="topLeft"
        title=""
        content={<EmojiPicker onEmojiClick={onEmojiClick} />}
        className="rounded-xl"
        trigger="click"
    >
        <ReactSVG data-testid="emoji-button" src={Smile} className="cursor-pointer" />
    </Popover>
));

export default EmojiPanel;
