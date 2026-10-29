import React from 'react';

export type CompanyTypeView = 'overview' | 'compare';

interface CompanyTypeViewToggleProps {
    value: CompanyTypeView;
    onChange: (next: CompanyTypeView) => void;
}

const tabBase: React.CSSProperties = {
    padding: '6px 16px',
    borderRadius: 999,
    border: 0,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
    background: 'transparent',
    color: '#6B7280',
    lineHeight: 1.2,
};

const tabActive: React.CSSProperties = {
    background: '#fff',
    color: '#FF4F4F',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.06)',
};

const CompanyTypeViewToggle: React.FC<CompanyTypeViewToggleProps> = ({ value, onChange }) => (
    <div
        role="tablist"
        style={{
            display: 'inline-flex',
            padding: 4,
            background: '#F3F4F6',
            borderRadius: 999,
            gap: 4,
        }}
    >
        <button
            type="button"
            role="tab"
            aria-selected={value === 'overview'}
            style={{ ...tabBase, ...(value === 'overview' ? tabActive : null) }}
            onClick={() => onChange('overview')}
        >
            Quick view
        </button>
        <button
            type="button"
            role="tab"
            aria-selected={value === 'compare'}
            style={{ ...tabBase, ...(value === 'compare' ? tabActive : null) }}
            onClick={() => onChange('compare')}
        >
            Compare features
        </button>
    </div>
);

export default CompanyTypeViewToggle;
