import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Card, theme } from 'antd';

interface ScrollAreaProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    direction?: 'horizontal' | 'vertical';
}

export default function ScrollArea({
    children,
    className = '',
    style = {},
    direction = 'horizontal',
}: ScrollAreaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { token } = theme.useToken();

    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const [showTop, setShowTop] = useState(false);
    const [showBottom, setShowBottom] = useState(false);

    const checkScroll = () => {
        const el = containerRef.current;
        if (!el) return;

        setShowLeft(el.scrollLeft > 0);
        setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);

        setShowTop(el.scrollTop > 0);
        setShowBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    };

    useEffect(() => {
        checkScroll();
        const el = containerRef.current;

        if (el) {
            el.addEventListener('scroll', checkScroll);
        }
        window.addEventListener('resize', checkScroll);

        return () => {
            if (el) {
                el.removeEventListener('scroll', checkScroll);
            }
            window.removeEventListener('resize', checkScroll);
        };
    }, []);

    const overflowX = direction === 'horizontal' ? 'auto' : 'hidden';
    const overflowY = direction === 'vertical' ? 'auto' : 'hidden';

    return (
        <Card
            bordered={false}
            className={className}
            style={{ position: 'relative', ...style }}
            bodyStyle={{ padding: 0 }}
        >
            <div
                ref={containerRef}
                style={{
                    overflowX,
                    overflowY,
                    whiteSpace: direction === 'horizontal' ? 'nowrap' : 'normal',
                }}
            >
                {children}
            </div>

            {/* Horizontal Shadows */}
            {direction === 'horizontal' && showLeft && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: 30,
                        pointerEvents: 'none',
                        background: `linear-gradient(to right, ${token.colorBgContainer} 60%, transparent)`,
                    }}
                />
            )}

            {direction === 'horizontal' && showRight && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: 30,
                        pointerEvents: 'none',
                        background: `linear-gradient(to left, ${token.colorBgContainer} 60%, transparent)`,
                    }}
                />
            )}

            {/* Vertical Shadows */}
            {direction === 'vertical' && showTop && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: 30,
                        width: '100%',
                        pointerEvents: 'none',
                        background: `linear-gradient(to bottom, ${token.colorBgContainer} 60%, transparent)`,
                    }}
                />
            )}

            {direction === 'vertical' && showBottom && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        height: 30,
                        width: '100%',
                        pointerEvents: 'none',
                        background: `linear-gradient(to top, ${token.colorBgContainer} 60%, transparent)`,
                    }}
                />
            )}
        </Card>
    );
}
