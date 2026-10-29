import React from 'react';

import { Flex, Grid, Image, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import InlineSvg, { isSvgMarkup } from '@components/molecular/InlineSvg';

import '../assets/styles.css';

// Backend-provided icons are absolute URLs (CloudFront); render them with an <img>
// (no CORS needed) instead of react-svg (which fetches over XHR and fails
// cross-origin). Bundled local assets keep using react-svg.
const isRemoteIcon = (icon: unknown): icon is string =>
    typeof icon === 'string' && /^https?:\/\//.test(icon);

// A card icon can arrive from three places — pasted SVG markup, a remote URL, or a
// bundled asset — and all three must come out the same size. The bundled path is
// sized by `.more-services div svg` in styles.css, so that value is the reference
// the other two match; keeping them in sync here is what stops DB-driven icons
// rendering at half the size of the built-in ones.
// Tailwind compiles arbitrary values at build time, so the inline-SVG branch has to
// repeat `3.625rem` as a literal — keep these three in step if the size changes.
const ICON_PX = 58; // 3.625rem
const ICON_XS_PX = 20;


interface IconCardProps {
    icon: string;
    title: string;
    path: string;
    status: string;
}

const Card: React.FC<IconCardProps> = ({ icon, title, path, status }) => {
    let color = '';

    if (status === 'Free') {
        color = 'text-green-500';
    } else if (status === 'New') {
        color = 'text-red-500';
    } else if (status === 'Coming soon') {
        color = 'text-orange-500';
    }
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();

    const handleClick = () => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('service_viewed', {
                service_name: path.split('/').filter(Boolean).pop() ?? path,
            });
        }
    };

     // Pasted SVG markup renders inline (no CORS, recolourable); legacy remote URLs
    // use <img>; bundled local assets use react-svg.
    const renderIcon = () => {
        if (isSvgMarkup(icon)) {
            return (
                <InlineSvg
                    code={icon}
                    className={`flex ${
                        screens.xs
                            ? '[&_svg]:h-5 [&_svg]:w-5'
                            : '[&_svg]:h-[3.625rem] [&_svg]:w-[3.625rem]'
                    }`}
                />
            );
        }
        if (isRemoteIcon(icon)) {
            return (
                <Image
                    src={icon}
                    preview={false}
                    width={screens.xs ? ICON_XS_PX : ICON_PX}
                    height={screens.xs ? ICON_XS_PX : ICON_PX}
                    className="object-contain"
                />
            );
        }
        return (
            <ReactSVG
                className="more-services"
                beforeInjection={svg => {
                    if (screens.xs) {
                        svg.setAttribute('style', 'width: 20px; height: 20px;');
                    }
                }}
                src={icon}
            />
        );
    };


    return (
        <Flex vertical align="center">
            <Link to={path} onClick={handleClick}>
                <Flex
                    vertical
                    align="center"
                    className="transition duration-300 transform cursor-pointer hover:scale-105"
                >
                    <Flex
                        className={`w-16 h-16 sm:w-[6.75rem] sm:h-28 bg-[#F9F6F5] rounded-2xl sm:rounded-3xl text-${color}`}
                        align="center"
                        justify="center"
                    >
                         {renderIcon()}
                    </Flex>
                    <Typography.Text className="text-[.65rem] text-center sm:text-[0.875rem] min-h-9 sm:min-h-14 line-clamp-2 pt-1 sm:pt-3">
                        {title}
                    </Typography.Text>
                </Flex>
            </Link>
        </Flex>
    );
};

export default Card;
