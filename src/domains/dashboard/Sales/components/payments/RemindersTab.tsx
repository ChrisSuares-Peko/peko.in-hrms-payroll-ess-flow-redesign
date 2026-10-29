import { Flex } from 'antd';

import ReminderRulesSection from './reminders/ReminderRulesSection';
// import ScheduledRemindersTable from './reminders/ScheduledRemindersTable';
// import { ACTIVITY_DATA } from '../../utils/dummyData';
// import RankingPanel from '../shared/RankingPanel';

const RemindersTab = () => (
    <Flex vertical gap={24}>
        <ReminderRulesSection />
        {/* <ScheduledRemindersTable /> */}
        {/* <RankingPanel title="Reminder Activity" data={ACTIVITY_DATA} variant="activity" /> */}
    </Flex>
);

export default RemindersTab;
