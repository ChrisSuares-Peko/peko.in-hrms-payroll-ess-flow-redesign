import MakeRecurringModal from '../../components/general/MakeRecurringModal';
import RecurringListHeader from '../../components/recurring/list/RecurringListHeader';
import RecurringStatsRow from '../../components/recurring/list/RecurringStatsRow';
import RecurringTable from '../../components/recurring/list/RecurringTable';
import { useRecurringList } from '../../hooks/recurring/list/useRecurringList';
import { useRecurringListPage } from '../../hooks/recurring/list/useRecurringListPage';

const RecurringList = () => {
    const { modalOpen, handleMakeRecurring, handleCloseModal, handleView } = useRecurringListPage();

    const {
        schedules,
        total,
        isLoading,
        stats,
        search,
        updateSearchText,
        statusFilter,
        setStatusFilter,
        range,
        setRange,
        page,
        setPage,
        pageSize,
        setPageSize,
        isPausing,
        isResuming,
        handlePause,
        handleResume,
        refetch,
    } = useRecurringList();

    return (
        <div className="pb-12">
            <RecurringListHeader
                onMakeRecurring={handleMakeRecurring}
                filter={statusFilter}
                onFilterChange={setStatusFilter}
                range={range}
                onRangeChange={setRange}
                search={search}
                onChange={updateSearchText}
            />

            <RecurringStatsRow
                totalSchedule={stats.totalSchedule}
                active={stats.active}
                revenueGenerated={stats.revenueGenerated}
                isLoading={isLoading}
            />

            <RecurringTable
                schedules={schedules}
                isLoading={isLoading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={(p, ps) => {
                    setPage(p);
                    setPageSize(ps);
                }}
                onView={handleView}
                onPause={handlePause}
                onResume={handleResume}
                isToggling={isPausing || isResuming}
            />

            <MakeRecurringModal
                open={modalOpen}
                onClose={handleCloseModal}
                onCreated={() => {
                    handleCloseModal();
                    refetch();
                }}
            />
        </div>
    );
};

export default RecurringList;
