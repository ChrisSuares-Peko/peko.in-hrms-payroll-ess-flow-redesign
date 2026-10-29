const {findAllNotification}= require('./../../models/use-cases/notification')

exports.findAllNotification = async (req, res) => {
    try {
        let result = await findAllNotification();
        res.send(result)
    } catch (e) {
        res.send(e.message)
    }

};