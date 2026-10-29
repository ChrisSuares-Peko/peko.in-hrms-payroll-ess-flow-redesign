import { JSXElementConstructor, ReactElement } from 'react';

import Icon from '@ant-design/icons';
import { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';
import { Image } from 'antd';
import { ReactSVG } from 'react-svg';


import InlineSvg, { isSvgMarkup } from '@components/molecular/InlineSvg';

// Renders a single nav glyph.
// - Pasted SVG markup (the current icon format) is rendered inline: it needs no
//   network/CORS AND recolours via the svg-primary active state, unlike an <img>.
// - Legacy remote (backend/CDN) icon URLs are drawn with an <img> (via antd Image) —
//   the only cross-origin-safe option (react-svg/CSS-mask both need CORS headers,
//   which S3/CloudFront don't send); these can't be recoloured on the active route.
// - Bundled local assets stay on react-svg so the svg-primary active recolour works.
const NavIconGlyph = ({ icon }: { icon: any }) => {
    if (!icon) return null;
    if (isSvgMarkup(icon)) {
        return <InlineSvg code={icon} className="flex h-4 w-4 [&_svg]:h-full [&_svg]:w-full" />;
    }
    if (typeof icon === 'string' && /^https?:\/\//.test(icon)) {
        return (
            <Image
                src={icon}
                preview={false}
                width={16}
                height={16}
                rootClassName="h-4 w-4"
                className="object-contain"
            />
        );
    }
    return <ReactSVG data-testid="nav-icon-svg" src={icon} key={icon} />;
};

export const NavIcon = (
    icon: any,
    isActive: boolean,
    isStrokeSvg?: boolean
): ReactElement<CustomIconComponentProps, string | JSXElementConstructor<any>> => (
    <Icon
        component={() => (
             <div className="flex h-4 w-4 items-center justify-center">
                <NavIconGlyph icon={icon} />
            </div>
        )}
        className={
            // eslint-disable-next-line no-nested-ternary
            isActive && isStrokeSvg ? 'svg-primary-stroke' : isActive ? 'svg-primary' : ''
        }
    />
);
