/**
 * Shiprocket vendor status → internal user-facing status mapping
 *
 * internalStatus   : value stored in shipmentOrders.status column
 * userMessage      : short label shown to end user
 * description      : longer description shown in tracking timeline
 * isMainStatus     : true = major milestone (show prominently in UI)
 */
const statusMapping = {
    "Pending": {
        internalStatus: "pending",
        userMessage: "Order confirmed",
        description: "Your order has been confirmed and is being processed.",
        isMainStatus: true,
    },
    "NEW": {
        internalStatus: "pending",
        userMessage: "Order confirmed",
        description: "Your order has been confirmed and is being processed.",
        isMainStatus: true,
    },
    "Pickup Pending": {
        internalStatus: "pickupPending",
        userMessage: "Pickup pending",
        description: "We are arranging a pickup for your shipment.",
        isMainStatus: true,
    },
    "Pickup Queued": {
        internalStatus: "pickupQueued",
        userMessage: "Pickup queued",
        description: "Your shipment pickup has been queued and will be scheduled shortly.",
        isMainStatus: false,
    },
    "Pickup Error": {
        internalStatus: "pickupError",
        userMessage: "Pickup issue",
        description: "There was an issue scheduling the pickup. Our team is working to resolve it.",
        isMainStatus: false,
    },
    "Pickup Rescheduled": {
        internalStatus: "pickupRescheduled",
        userMessage: "Pickup rescheduled",
        description: "Your pickup has been rescheduled.",
        isMainStatus: false,
    },
    "Out For Pickup": {
        internalStatus: "outForPickup",
        userMessage: "Out for pickup",
        description: "Our courier partner is on the way to pick up your package.",
        isMainStatus: true,
    },
    "Manifested": {
        internalStatus: "manifested",
        userMessage: "Manifested",
        description: "Your shipment has been manifested and is ready for dispatch.",
        isMainStatus: false,
    },
    "Shipped": {
        internalStatus: "shipped",
        userMessage: "Shipped",
        description: "Your shipment is on the way.",
        isMainStatus: true,
    },
    "In Transit": {
        internalStatus: "shipped",
        userMessage: "In transit",
        description: "Your shipment is in transit.",
        isMainStatus: true,
    },
    "Out For Delivery": {
        internalStatus: "outForDelivery",
        userMessage: "Out for delivery",
        description: "Your shipment is out for delivery.",
        isMainStatus: true,
    },
    "Delivered": {
        internalStatus: "delivered",
        userMessage: "Delivered",
        description: "Your shipment has been delivered successfully.",
        isMainStatus: true,
    },
    "Undelivered": {
        internalStatus: "undelivered",
        userMessage: "Undelivered",
        description: "A delivery attempt was made but could not be completed. Another attempt will be made.",
        isMainStatus: false,
    },
    "Delayed": {
        internalStatus: "delayed",
        userMessage: "Delayed",
        description: "Your shipment has been delayed. We apologize for the inconvenience.",
        isMainStatus: false,
    },
    "Cancelled": {
        internalStatus: "shipmentCanceled",
        userMessage: "Cancelled",
        description: "Your shipment has been cancelled.",
        isMainStatus: true,
    },
    "RTO Initiated": {
        internalStatus: "rtoInitiated",
        userMessage: "Return to origin initiated",
        description: "Your shipment could not be delivered and is being returned to the sender.",
        isMainStatus: true,
    },
    "RTO Out For Delivery": {
        internalStatus: "rtoOutForDelivery",
        userMessage: "Return out for delivery",
        description: "Your shipment is being delivered back to the sender.",
        isMainStatus: false,
    },
    "RTO Delivered": {
        internalStatus: "reverseReturned",
        userMessage: "Return to origin delivered",
        description: "Your shipment has been returned to the sender successfully.",
        isMainStatus: true,
    },
    "Lost": {
        internalStatus: "lost",
        userMessage: "Lost",
        description: "We're sorry, your shipment appears to be lost. Please contact support.",
        isMainStatus: true,
    },
};

// Kept for interface compatibility — not used with Shiprocket (ETD comes as a plain string already)
const DELIVERY_TIME_MAP = {
    unknown: { label: "Standard", minMinutes: 0 },
};

// Kept for interface compatibility — Shiprocket returns courier_name directly
const DELIVERY_TYPE_LABELS = {};

// Kept for interface compatibility — Shiprocket returns courier_name directly
const SERVICE_TYPE_LABELS = {};

module.exports = { statusMapping, DELIVERY_TIME_MAP, DELIVERY_TYPE_LABELS, SERVICE_TYPE_LABELS };
