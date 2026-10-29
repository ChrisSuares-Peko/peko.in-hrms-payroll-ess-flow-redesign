import React from 'react';

interface SectionLabelProps {
    children: React.ReactNode;
}

// Small section heading: a red accent bar + uppercase, letter-spaced label
// (mirrors the vendor's SectionLabel structure, in Peko's brand red).
const SectionLabel: React.FC<SectionLabelProps> = ({ children }) => (
    <div className="flex items-center gap-2">
        <span
            style={{
                width: 3,
                height: 14,
                borderRadius: 2,
                background: '#FF4F4F',
                flexShrink: 0,
            }}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {children}
        </span>
    </div>
);

export default SectionLabel;
