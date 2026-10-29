import { Button, Col, Row, Skeleton } from 'antd';

import RecurringCustomerCard from '../../components/recurring/view/RecurringCustomerCard';
import RecurringScheduleCard from '../../components/recurring/view/RecurringScheduleCard';
import RecurringViewHeader from '../../components/recurring/view/RecurringViewHeader';
import RunHistory from '../../components/recurring/view/RunHistory';
import { useRecurringViewPage } from '../../hooks/recurring/view/useRecurringViewPage';

const RecurringView = () => {
    const {
        recurringId,
        schedule,
        isLoading,
        isActioning,
        isActive,
        isPaused,
        isEnded,
        subtitle,
        backToList,
        handlePause,
        handleResume,
        handleEnd,
    } = useRecurringViewPage();

    if (!recurringId && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm text-gray-500 mb-3">No schedule selected.</p>
                <Button onClick={backToList}>Go back to list</Button>
            </div>
        );
    }

    return (
        <div className="pb-12">
            <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 shadow-sm mb-6">
                <RecurringViewHeader
                    scheduleName={schedule?.scheduleName}
                    subtitle={subtitle}
                    isLoading={isLoading}
                    isActive={isActive}
                    isPaused={isPaused}
                    isEnded={isEnded}
                    isActioning={isActioning}
                    onBack={backToList}
                    onPause={handlePause}
                    onResume={handleResume}
                    onEnd={handleEnd}
                />
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={15}>
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 mb-5">Run history</h3>
                        {isLoading ? (
                            <Skeleton active paragraph={{ rows: 6 }} />
                        ) : (
                            schedule && <RunHistory schedule={schedule} />
                        )}
                    </div>
                </Col>

                <Col xs={24} md={9}>
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Schedule</h3>
                        <RecurringScheduleCard schedule={schedule} isLoading={isLoading} />
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Customer</h3>
                        <RecurringCustomerCard
                            sourceInvoice={schedule?.sourceInvoice}
                            isLoading={isLoading}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default RecurringView;
