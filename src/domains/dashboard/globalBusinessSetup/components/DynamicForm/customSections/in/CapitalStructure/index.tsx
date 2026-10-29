import { Col, InputNumber, Row } from 'antd';

import { useCapitalStructure } from './useCapitalStructure';
import { CustomSectionRenderProps } from '../../types';

const RUPEE = <span className="text-sm text-gray-400">₹</span>;

type CapitalFieldProps = {
    label: string;
    description: string;
    value: number | null;
    onChange: (value: number | null) => void;
    error?: string;
};

function CapitalField({ label, description, value, onChange, error }: CapitalFieldProps) {
    return (
        <div>
            <p className="mb-1 text-sm font-medium text-gray-700">
                {label}
                <span className="ms-1 text-red-500">*</span>
            </p>
            <InputNumber
                className="w-full"
                min={1}
                precision={0}
                prefix={RUPEE}
                status={error ? 'error' : undefined}
                value={value}
                onChange={onChange}
            />
            <p className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-gray-400'}`}>
                {error || description}
            </p>
        </div>
    );
}

/**
 * Custom section: MCA incorporation capital structure. Collects authorized capital,
 * paid-up capital, and face value per share, validates the cross-field constraints
 * (paid-up ≤ authorized, divisibility by face value), and displays the
 * auto-calculated share counts.
 */
export default function CapitalStructure({ section, instancePath }: CustomSectionRenderProps) {
    const ctrl = useCapitalStructure(section, instancePath);

    // Raw stored value (string, like all dynamic-form number fields) → InputNumber
    // display value. Reading the raw value instead of the hook's parsed numbers
    // (which null out 0/invalid input) keeps in-progress typing intact.
    const numValue = (name: string): number | null => {
        const raw = ctrl.get(name);
        if (raw === undefined || raw === null || raw === '') return null;
        const n = Number(raw);
        return Number.isNaN(n) ? null : n;
    };

    const setNum = (name: string) => (value: number | null) =>
        ctrl.set(name, value === null || value === undefined ? '' : String(value));

    return (
        <div className="w-full space-y-6">
            <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Capital Structure</h4>
                <Row gutter={[16, 16]} className="py-3">
                    <Col xs={24} sm={8}>
                        <CapitalField
                            label="Authorized Capital (₹)"
                            description="Min ₹1,00,000"
                            value={numValue('authorized_capital')}
                            onChange={setNum('authorized_capital')}
                            error={ctrl.authorizedError}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <CapitalField
                            label="Paid-up Capital (₹)"
                            description="Cannot exceed authorized capital"
                            value={numValue('paid_up_capital')}
                            onChange={setNum('paid_up_capital')}
                            error={ctrl.paidUpError}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <CapitalField
                            label="Face Value per Share (₹)"
                            description="Typically ₹10"
                            value={numValue('face_value_per_share')}
                            onChange={setNum('face_value_per_share')}
                            error={ctrl.faceValueError}
                        />
                    </Col>
                </Row>
            </div>

            <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Calculated Values</h4>
                <div className="flex divide-x rounded-xl bg-red-50/40">
                    <div className="flex flex-1 flex-col gap-1 p-4">
                        <p className="text-sm text-gray-500">Authorized Shares</p>
                        <p className="text-2xl font-bold">
                            {(ctrl.authorizedShares ?? 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                        <p className="text-sm text-gray-500">Paid-up Shares</p>
                        <p className="text-2xl font-bold">
                            {(ctrl.paidUpShares ?? 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
