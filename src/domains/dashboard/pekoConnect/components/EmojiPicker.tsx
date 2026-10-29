/* eslint-disable no-nested-ternary */
import React, { Suspense } from 'react';

import { Grid, Spin } from 'antd';

const EmojiPickerReact = React.lazy(() => import('emoji-picker-react'));

type EmojiPanelProps = {
    onEmojiClick: (emoji: any) => void;
};

const { useBreakpoint } = Grid;

export default function EmojiPicker({ onEmojiClick }: EmojiPanelProps) {
    const screen = useBreakpoint();
    return (
        <Suspense
            fallback={
                <div className="size-32 flex justify-center items-center">
                    <Spin />
                </div>
            }
        >
            <EmojiPickerReact
                width={
                    screen.xxl
                        ? 300
                        : screen.xl
                          ? 280
                          : screen.lg
                            ? 250
                            : screen.md
                              ? 270
                              : screen.sm
                                ? 270
                                : 220
                }
                height={
                    screen.xxl
                        ? 360
                        : screen.xl
                          ? 340
                          : screen.lg
                            ? 340
                            : screen.md
                              ? 340
                              : screen.sm
                                ? 340
                                : 340
                }
                lazyLoadEmojis
                previewConfig={{ showPreview: !screen.xs }}
                onEmojiClick={onEmojiClick}
            />
        </Suspense>
    );
}
