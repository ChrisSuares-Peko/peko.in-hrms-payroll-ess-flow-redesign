import { Image, Typography } from 'antd';

import InlineSvg, { isSvgMarkup } from './InlineSvg';

/**
 * Preview swatch for a `permissions[].icon` in the permission editors.
 *
 * The field holds one of two things: SVG markup the admin has pasted, which is
 * stored verbatim, or a legacy S3/CDN URL from before icons moved to markup.
 * Markup renders inline so it can be seen before saving; a URL is drawn with an
 * <img>, the only cross-origin-safe option (CloudFront sends no CORS headers, so
 * react-svg can't fetch it) — and unlike markup it can't be recoloured on select.
 */
const PermissionIconPreview = ({ icon }: { icon?: string }) => {
    if (isSvgMarkup(icon)) {
        return <InlineSvg code={icon} className="flex [&_svg]:h-8 [&_svg]:w-8" />;
    }

    if (icon) {
        return (
            <Image
                src={icon}
                alt=""
                preview={false}
                width={32}
                height={32}
                className="object-contain"
            />
        );
    }

    return (
        <Typography.Text type="secondary" className="text-[0.65rem]">
            No icon
        </Typography.Text>
    );
};

export default PermissionIconPreview;
