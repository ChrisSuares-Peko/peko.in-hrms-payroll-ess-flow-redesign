import DOMPurify from 'dompurify';

// True when the value is pasted SVG markup (as opposed to an image URL or a
// bundled asset path). URLs never contain a `<svg` tag, so this is a safe split.
export const isSvgMarkup = (value: unknown): value is string =>
    typeof value === 'string' && /<svg[\s>]/i.test(value);

interface InlineSvgProps {
    code: string;
    className?: string;
}

// Renders pasted SVG markup inline (sanitized via DOMPurify's SVG profile, which
// strips <script>, event handlers, etc.). Inline SVG needs no network/CORS AND can
// be recoloured with CSS (e.g. the sidebar's svg-primary active state) — unlike an
// <img>. Sizing is controlled by the caller through `className` (e.g. Tailwind
// arbitrary variants like `[&_svg]:h-full`).
const InlineSvg = ({ code, className }: InlineSvgProps) => (
    <span
        aria-hidden
        className={className}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(code, { USE_PROFILES: { svg: true, svgFilters: true } }),
        }}
    />
);

export default InlineSvg;
