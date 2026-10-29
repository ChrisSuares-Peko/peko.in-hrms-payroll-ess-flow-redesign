import { useState } from 'react';

import { Typography } from 'antd';

import { regionList } from '../../types/eSIM';

const { Text } = Typography;

const VISIBLE_COUNT = 12;

type RegionCoverageProps = {
    regionLabel: string;
    countries: regionList['countries'];
};

export const RegionCoverage = ({ regionLabel, countries }: RegionCoverageProps) => {
    const [expanded, setExpanded] = useState(false);

    if (!countries?.length) return null;

    const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));
    const hiddenCount = sortedCountries.length - VISIBLE_COUNT;
    const visibleCountries =
        expanded || hiddenCount <= 0 ? sortedCountries : sortedCountries.slice(0, VISIBLE_COUNT);

    return (
        <div className="esim-region-coverage">
            <Text strong className="esim-region-coverage-title">
                {`Coverage — ${regionLabel} (${sortedCountries.length} countries)`}
            </Text>
            <div className="esim-region-coverage-chips">
                {visibleCountries.map(country => (
                    <span key={country.code} className="esim-region-coverage-chip">
                        {country.name}
                    </span>
                ))}

                {hiddenCount > 0 && (
                    <button
                        type="button"
                        className="esim-region-coverage-toggle"
                        onClick={() => setExpanded(prev => !prev)}
                    >
                        {expanded ? 'Show less' : `+${hiddenCount} more`}
                    </button>
                )}
            </div>
        </div>
    );
};
