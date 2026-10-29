const express = require('express')
const router = express.Router()
const Razorpay = require('razorpay');
const ErrorResponse = require('../../../../utils/error-response');
let instance = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY,
    key_secret: process.env.RAZOR_PAY_SECRET
});

router.post('/', async (req, res, next) => {

    try {
        let options = {
            amount: req.body.razorPayAmount * 100,  // amount in the smallest currency unit
            currency: "INR"
        };
        const order = await instance.orders.create(options);
        console.log({ order });
        return res.status(200).json({
            'success': true,
            orderId: order.id
        })
    } catch (error) {
        console.log({ error });
        return next(new ErrorResponse(error.error.description ?? `Error while creating order`, 200))
    }
})

module.exports = router