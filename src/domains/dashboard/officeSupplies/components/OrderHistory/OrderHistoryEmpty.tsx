import type { FC } from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import noProductsSVG from '../../assets/icons/noProducts.svg';

interface OrderHistoryEmptyProps {
    /**
     * True when a search term or date range is active, so we can say "nothing matched"
     * rather than "you have no orders" — the latter reads as broken when the user can see
     * they've filtered the list down.
     */
    filtered?: boolean;
}

/**
 * Empty state for Office Supplies order history, shared by the desktop table and the
 * mobile card list so the two can't drift.
 *
 * Matches the existing office-supplies empty pattern (ProductListing / ProductResultsPage):
 * the same `noProducts` glyph above muted centred copy.
 */
const OrderHistoryEmpty: FC<OrderHistoryEmptyProps> = ({ filtered = false }) => (
    <Flex vertical gap={24} className="w-full py-16" justify="center" align="center">
        <ReactSVG width={120} src={noProductsSVG} />
        <Flex vertical gap={4} align="center">
            <Typography.Text className="text-center text-base text-gray-400">
                {filtered ? 'No orders match your filters' : 'No orders yet'}
            </Typography.Text>
            <Typography.Text className="text-center text-sm text-gray-300">
                {filtered
                    ? 'Try a different search term or date range.'
                    : 'Your Office Supplies orders will appear here once you place one.'}
            </Typography.Text>
        </Flex>
    </Flex>
);

export default OrderHistoryEmpty;
