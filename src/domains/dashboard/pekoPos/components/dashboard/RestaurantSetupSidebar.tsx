import { CheckOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

export type SetupStep = {
    label: string;
    sublabel?: string;
    done: boolean;
};

type RestaurantSetupSidebarProps = {
    steps: SetupStep[];
};

const RestaurantSetupSidebar = ({ steps }: RestaurantSetupSidebarProps) => {
    const doneCount = steps.filter(s => s.done).length;
    const totalCount = steps.length;
    const progressPercent = totalCount === 0 ? 0 : (doneCount / totalCount) * 100;
    const allDone = doneCount === totalCount && totalCount > 0;

    return (
        <div className="bg-stone-50 rounded-3xl p-8">
            <Flex vertical gap={14}>
                <Typography.Title level={4} className="!mb-0 !text-gray-900 !font-semibold">
                    Restaurant Setup
                </Typography.Title>

                <div
                    className={`border rounded-2xl p-5 ${
                        allDone
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-amber-50 border-amber-100'
                    }`}
                >
                    <Flex align="center" gap={12}>
                        <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-borderPrimaryLight flex items-center justify-center">
                            <CheckOutlined className="text-lightRed" />
                        </div>
                        <div className="flex-1">
                            <Typography.Text
                                className={`block text-base font-semibold mb-2 ${
                                    allDone ? 'text-emerald-700' : 'text-amber-600'
                                }`}
                            >
                                {allDone ? 'All set' : `${doneCount} of ${totalCount} complete`}
                            </Typography.Text>
                            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        allDone ? 'bg-emerald-500' : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </Flex>
                </div>

                <div className="bg-white rounded-3xl p-6">
                    {steps.map((step, i) => {
                        const isLast = i === steps.length - 1;
                        return (
                            <div key={step.label} className="flex items-stretch gap-3">
                                <div className="flex flex-col items-center shrink-0">
                                    <div
                                        className={`w-8 h-8 rounded-full bg-white flex items-center justify-center ${
                                            step.done
                                                ? 'border border-successGreen'
                                                : 'border border-zinc-300'
                                        }`}
                                    >
                                        {step.done && (
                                            <CheckOutlined className="text-successGreen text-xs" />
                                        )}
                                    </div>
                                    {!isLast && <div className="w-px flex-1 bg-zinc-300 my-1" />}
                                </div>
                                <div className={`flex-1 ${!isLast ? 'pb-6' : ''}`}>
                                    <div className="h-8 flex items-center">
                                        <Typography.Text className="text-base text-black">
                                            {step.label}
                                            {step.sublabel && (
                                                <span className="text-neutral-500">
                                                    {' '}
                                                    — {step.sublabel}
                                                </span>
                                            )}
                                        </Typography.Text>
                                    </div>
                                    {!isLast && <div className="border-t border-zinc-200 mt-3" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Flex>
        </div>
    );
};

export default RestaurantSetupSidebar;
