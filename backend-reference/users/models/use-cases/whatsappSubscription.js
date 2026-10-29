const WhatsAppSubscription = require("../entities/whatsappSubscription");


exports.findWhatsAppSubscription = async (params) => {
    try {
        const { subscriptionId, corporateId } = params

        const subscription = await WhatsAppSubscription.findOne({
            where: {
                id: subscriptionId,
                corporateUserId: corporateId
            },
            raw: true,
            nest: true
        })

        return subscription
    } catch (error) {
        console.error('Error finding package details:', error);
        return false
    }
}

exports.cancelWhatsAppSubscription = async (params) => {
    try {
        const { subscriptionId } = params

        await WhatsAppSubscription.update(
            {
                isCancelled: true  
            }, {
            where: {
                id: subscriptionId,
            }
        })

        return { success: true, message: "Your subscription has been cancelled. You will still be able to use the service until the end of your current billing cycle." }
    } catch (error) {
        console.error('Error finding package details:', error);
        return false
    }
}