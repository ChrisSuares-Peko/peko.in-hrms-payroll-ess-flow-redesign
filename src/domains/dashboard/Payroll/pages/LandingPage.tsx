
import React, { Suspense, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import ActivitySkeleton from '../components/Dashboard/ActivitySkeleton';
import { fetchDashboardData } from '../hooks/dashboardHooks/useDashboardApi';
import { useProgressApi } from '../hooks/dashboardHooks/useProgressApi';
import { setPayrollProgress } from '../slices/payrollAuth';

const WelcomePage = React.lazy(() => import('./WelcomePage'));
const Dashboard = React.lazy(() => import('./Dash'));

const LandingPage = () => {
    const { isLoading, setRefresh } = useProgressApi();
    const { progress, isSkippedDasboard } = useAppSelector(state => state.reducer.payrollAuth);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    // Fire /dashBoard and preload the Dash chunk immediately — in parallel with /progress.
    // By the time /progress resolves and Dash mounts, data is already cached or in-flight.
    useEffect(() => {
        fetchDashboardData(id, role);
        import('./Dash');
    }, [id, role]);

    useEffect(() => {
        if (!isLoading && progress !== '100%') {
            dispatch(setPayrollProgress({ showDashboard: false }));
        }
    }, [dispatch, progress, isLoading]);

    useEffect(() => {
        if (progress !== '100%') {
            import('./WelcomePage');
        }
    }, [progress]);

    if (isLoading && progress === '0%') {
        return <ActivitySkeleton />;
    }

    return (
        <Suspense fallback={<ActivitySkeleton />}>
            {progress === '100%' || isSkippedDasboard ? (
                <Dashboard />
            ) : (
                <WelcomePage setRefresh={setRefresh} />
            )}
        </Suspense>
    );
};

export default LandingPage;
