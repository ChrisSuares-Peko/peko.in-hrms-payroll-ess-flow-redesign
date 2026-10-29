import { Select } from 'antd';

import { QUORUM_OPTIONS, VOTING_OPTIONS } from './constants';
import { LlpAgreementController } from './useLlpAgreement';

export default function ManagementCard({ controller }: { controller: LlpAgreementController }) {
    return (
        <div>
            <h3 className="text-base font-semibold text-gray-800">Management &amp; Meetings</h3>
            <p className="text-sm text-gray-500">Configure how decisions will be made in the LLP</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Quorum (minimum partners required)
                    </p>
                    <Select
                        className="w-full"
                        value={controller.meetingQuorum}
                        options={QUORUM_OPTIONS}
                        onChange={controller.setMeetingQuorum}
                    />
                </div>
                <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1">
                        Voting Threshold for Decisions
                    </p>
                    <Select
                        className="w-full"
                        value={controller.votingThreshold}
                        options={VOTING_OPTIONS}
                        onChange={controller.setVotingThreshold}
                    />
                </div>
            </div>
        </div>
    );
}
