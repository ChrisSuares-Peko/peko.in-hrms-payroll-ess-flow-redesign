import { Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';

type Props = {
    text?: string;
};

// Normalizes the Terms & Conditions HTML/text into a flat list of bullet
// lines, whether the source already has structure (<li>/<p>/<br>) or is a
// single block of prose (falls back to splitting on sentence boundaries).
const toBulletPoints = (html: string): string[] => {
    if (!html) return [];

    const withLineBreaks = html.replace(/<\s*(br|\/li|\/p|\/div)\s*\/?>/gi, '\n');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = withLineBreaks;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    let lines = plainText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length <= 1) {
        lines = plainText
            .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
            .map(line => line.trim())
            .filter(Boolean);
    }

    // Source text often numbers its own points ("1. ...", "2. ..."); strip
    // that since each point is rendered as its own bullet already.
    return lines.map(line => line.replace(/^\d+[.)]\s*/, ''));
};

function HowToUseTab({ text }: Props) {
    const bullets = toBulletPoints(text || '');

    return (
        <Content>
            <Flex>
                {bullets.length > 0 && (
                    <ul className="gift-card-html-content w-full text-black text-xs font-normal leading-loose tracking-wider">
                        {bullets.map((line, index) => (
                            // Bullet rendered as its own flex item (not a native list marker) so
                            // wrapped lines indent under the text instead of the bullet/number.
                            <li key={index} className="flex gap-2">
                                <span className="mt-[0.55em] h-[5px] w-[5px] flex-none rounded-full bg-black" />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Flex>
        </Content>
    );
}

export default HowToUseTab;
