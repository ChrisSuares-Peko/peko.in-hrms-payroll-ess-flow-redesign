import droomSvg from '../../assets/svg/droom.svg';

interface Props {
    // Rendered height of the wordmark in px.
    height?: number;
}

// "droom" wordmark as a single pre-composed SVG (assets/svg/droom.svg) — the letters
// were previously stitched together at runtime from per-letter SVGs, whose px rounding
// misaligned the baseline at small sizes (bug 30118).
const DroomLogo = ({ height = 26 }: Props) => (
    <img src={droomSvg} alt="droom" style={{ height }} />
);

export default DroomLogo;
