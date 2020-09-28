const log4js = require('log4js');
const log = log4js.getLogger('alexa');

const verifier = require('alexa-verifier');
const Assistant = require('../services/Assistant');

const manageMessage = (message) => {
    const request = message.request;
    const requestType = message.request.type;
    const userId = message.session.user.userId;

    /*
    const sessionId = message.session.sessionId;
    const newSession = message.session.new;
    const applicationId = message.session.application.applicationId;
    const apiEndpoint = message.context.System.apiEndpoint;
    const apiAccessToken = message.context.System.apiAccessToken;
    */

    let text = '';
    if (requestType === 'IntentRequest' && request.intent.name === 'watson') {
        if (request.intent && request.intent.slots &&
            request.intent.slots.speech && request.intent.slots.speech.value) {
            text = request.intent.slots.speech.value
        }
    }

    return {
        domain: 'tombolo',
        sessionId: userId,
        text,
    };
};

const mapAssistantResponse = (response) => {
    let text = 'Mi dispiace, al momento non so come rispondere.';
    if (response && response.output && response.output.text) {
        text = response.output.text.join('\n');
    }

    return {
        text,
        title: 'Tombolò',
        endSession: false,
        attributes: {},
        reprompt: false,
    }
};

const formatResponse = ({text, title, endSession, attributes, reprompt}) => {
    const r = {
        version: '1.0',
        sessionAttributes: attributes,
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: text,
            },
            card: {
                type: 'Simple',
                title: title,
                content: text,
            },
            shouldEndSession: endSession,
        }
    };

    if (reprompt) {
        r.response.reprompt = {
            outputSpeech: {
                type: 'PlainText',
                text: reprompt,
            }
        };
    }
    return r;
};

module.exports.alexa = (req, res) => {
    const params = req.swagger.params;
    const body = params.body.value;

    log.info('from alexa: %j', body);
    res.status(500).json({error:true});

    /*
    const cert_url = req.headers['signaturecertchainurl'];
    const signature = req.headers['signature'];
    verifier(cert_url, signature, JSON.stringify(req.body)).then((data) => {
        return Assistant.sendMessage(manageMessage(params.body.value));
    }).then((data) => {
        res.json(formatResponse(mapAssistantResponse(data)));
    }).catch((error) => {
        res.status(400).json({error: true});
        log.error(error);
    });
    */
};
