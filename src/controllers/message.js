const log4js = require('log4js');
const Assistant = require('../services/Assistant');

module.exports.message = async (req, res) => {
    const log = log4js.getLogger('message');

    const params = req.swagger.params;
    const body = params.body.value;
    const {userId, text, ...extra} = body;

    log.info('Received message from %s: %s', userId, text || '(empty)');

    try {
        const r = await Assistant.sendMessage(userId, text, extra);
        log.info('Answering with messages to %s: %j', userId, r.output.generic[0]);
        res.send(r);
    } catch (error) {
        log.error('ERROR', error);
        res.status(500).send(error);
    }
};
