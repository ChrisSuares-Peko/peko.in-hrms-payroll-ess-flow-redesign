import { Flex, Skeleton } from 'antd';

/**
 * Placeholder for the KYC/KYB gate while the status API decides which screen belongs on screen.
 *
 * Mirrors the gate layout (centred intro, bordered checklist card, full-width CTA) so resolving to a real
 * screen does not shift the page.
 */
const GateSkeleton = () => (
    <Flex vertical data-testid="gate-skeleton">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-4 pt-1 xl:pb-8 xl:pt-2">
            <Flex vertical align="center" gap={16}>
                <Skeleton.Button active size="small" shape="round" style={{ width: 150 }} />
                <Skeleton
                    active
                    title={{ width: '55%' }}
                    paragraph={{ rows: 2, width: ['90%', '70%'] }}
                    className="w-full"
                />
            </Flex>

            <div className="flex flex-col gap-6 rounded-3xl border border-borderGray bg-white p-6 xl:p-9">
                <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 4 }} />
            </div>

            <Skeleton.Button active block style={{ height: 56 }} />
        </div>
    </Flex>
);

export default GateSkeleton;
