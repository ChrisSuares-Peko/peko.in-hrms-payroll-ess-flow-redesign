import { Input, Select } from 'antd';

import { DISPUTE_OPTIONS } from './constants';
import { LlpAgreementController } from './useLlpAgreement';

export default function DisputeCard({ controller }: { controller: LlpAgreementController }) {
    return (
        <div>
            <h3 className="text-base font-semibold text-gray-800">Dispute Resolution</h3>
            <p className="text-sm text-gray-500">
                Define how disputes between partners will be resolved
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
                <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1">
                        Dispute Resolution Method <span className="text-red-500">*</span>
                    </p>
                    <Select
                        className="w-full"
                        value={controller.disputeMethod}
                        options={DISPUTE_OPTIONS}
                        onChange={controller.setDisputeMethod}
                    />
                </div>
                <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1">
                        Jurisdiction <span className="text-red-500">*</span>
                    </p>
                    <Input
                        status={controller.jurisdictionError ? 'error' : undefined}
                        placeholder="e.g. Delhi"
                        value={controller.jurisdiction}
                        onChange={e => controller.setJurisdiction(e.target.value)}
                    />
                    {controller.jurisdictionError && (
                        <p className="mt-1 text-xs text-red-500">{controller.jurisdictionError}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
