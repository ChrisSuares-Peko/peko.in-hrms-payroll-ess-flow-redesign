import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

import AlertsTable from '../components/TaskToDo/AlertsTable';

const TaskToDo = () => {
    useHideWidgetOnDrawer(true);
    useScrollToTop();

    return <AlertsTable />;
};

export default TaskToDo;
