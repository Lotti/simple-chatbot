const log4js = require('log4js');
const log = log4js.getLogger('alexa');
const assert = require('assert').strict;
const jwt = require('jsonwebtoken');
const verifier = require('alexa-verifier');
const Assistant = require('../services/Assistant');

const {audioTemplate, displayTemplate} = require('../libraries/alexaTemplates');


assert(process.env.JWT_SECRET, 'Missing environment var JWT_SECRET');
const jwtSecret = process.env.JWT_SECRET;


const storeButtonInContext = (conversationToken, option) => {
    if (!conversationToken.buttons) {
        conversationToken.buttons = {};
    }
    // salvo i pulsanti nel conversation token
    conversationToken.buttons[option.label.toLowerCase()] = option.value;
};


const formatResponse = (response, alexaBody) => {
    let capabilities = [];
    let viewPort = {};

    if (alexaBody && alexaBody.context && alexaBody.context.System) {
        capabilities = Object.keys(alexaBody.context.System.device.supportedInterfaces);
        viewPort = alexaBody.context.Viewport;
    }

    const conversationToken = {
        context: response.context.skills['main skill'].user_defined,
    };

    let text = '';
    let title = '', card = undefined;
    let aplTitle = '', aplDescription = '', aplImage = '';
    let aplButtons = [];
    let cards = 0;
    const maxCards = 1;

    // disambiguazione: se c'è disambiguazione, ritorno solo questa
    const suggestion = response.output.generic.find((g) => g.response_type === 'suggestion');
    if (suggestion) {
        aplTitle = suggestion.title;
        aplButtons = suggestion.suggestions.map((o) => {
            storeButtonInContext(conversationToken, o);
            return o.label;
        });
        text = suggestion.title;
        card = {
            title: suggestion.title,
            text: aplButtons.join(', '),
        };
    } else {
        // testi
        const texts = response.output.generic.filter((g) => g.response_type === 'text').map((g) => g.text);
        texts.forEach((t, i) => {
            if (i === 0) {
                aplTitle = t;
                title = t;
            } else {
                aplDescription+= '\n'+t;
                text = '\n'+t;
            }
        });

        // gestione immagini: trasformano una SimpleCard in StandardCard
        const img = response.output.generic.find((g) => g.response_type === 'image');
        if (img) {
            if (cards < maxCards) {
                cards++;
                card = {
                    title: img.title,
                    text: img.description,
                    url: img.source,
                }
            }

            aplImage = img.source;
            if (title.length > 0) {
                aplDescription = [aplTitle, aplDescription, img.description].join('\n');
                aplTitle = img.title;
                text = [title, text, img.description].join('\n');
                title = img.title;
            } else {
                aplDescription = [aplDescription, img.description].join('\n');
                aplTitle = img.title;
                text = [text, img.description].join('\n');
                title = img.title;
            }
        }

        // pulsanti
        const option = response.output.generic.find((g) => g.response_type === 'option');
        if (option) {
            aplButtons = option.options.map((o) => {
                storeButtonInContext(conversationToken, o);
                return o.label;
            });

            if (cards < maxCards) {
                cards++;
                card = {
                    title: option.title,
                    text: option.description + '\n' + aplButtons.join(', '),
                };
            }

            if (title.length > 0) {
                aplDescription = [aplDescription, option.title, option.description].join('\n');
                text = [text, option.title, option.description, aplButtons.join(', ')].join('\n');
            } else {
                aplDescription = [aplDescription, option.description].join('\n');
                aplTitle = option.title;
                text = [text, option.description, aplButtons.join(', ')].join('\n');
                title = option.title;
            }
        }
    }

    const finalResponse = Assistant.getContextVar(response, '_finalResponse', false);

    if (title.length === 0 && text.length === 0) {
        text = 'Non sono presenti risposte di tipo testuali in questo nodo di dialogo';
    }

    const output = {
        version: '1.0',
        sessionAttributes: {
            conversationToken: jwt.sign(conversationToken, jwtSecret),
        },
        response: {
            shouldEndSession: finalResponse
        },
    };
    if (capabilities.includes('Alexa.Presentation.APL')) {
        output.response.directives = [
            displayTemplate(viewPort, aplTitle, aplDescription, aplButtons, aplImage),
            audioTemplate(aplTitle, aplDescription, aplButtons)
        ];
    } else {
        output.response.outputSpeech = {
            type: 'PlainText',
            text: title + '\n' + text,
            playBehavior: 'ENQUEUE',
        };
        if (card) {
            output.response.card = {
                type: 'Standard',
                title: card.title,
                text: card.text,
                image: card.url ? {smallImageUrl: card.url, largeImageUrl: card.url} : undefined,
            };
        }
    }

    if (!finalResponse) {
        output.response.reprompt = {
            outputSpeech: {
                type: "PlainText",
                text: text.length > 0 ? text : title,
                playBehavior: 'ENQUEUE',
            }
        };
    }

    log.info('to alexa: %j', output);
    return output;
};

const formatInput = (body) => {
    log.info('from alexa - body: %j', body);

    const request = body.request;
    const userId = body.session.sessionId;
    let extra = {};
    let text = '';

    log.fatal('request.type', request.type);
    if (request.type === 'System.ExceptionEncountered') {
        text = '';
    } else if (request.type === 'SessionEndedRequest') {
        extra = {sessionEnd: true};
    } else if (request.type === 'Alexa.Presentation.APL.UserEvent') {
        text = request.arguments[0];
    } else if (request.type === 'IntentRequest' && request.intent.name === 'watson') {
        if (request.intent && request.intent.slots &&
            request.intent.slots.speech && request.intent.slots.speech.value) {
            text = request.intent.slots.speech.value
        }
    }

    if (body.session && body.session.attributes && body.session.attributes.conversationToken) {
        const conversationToken = jwt.verify(body.session.attributes.conversationToken, jwtSecret);
        extra = {...extra, context: conversationToken.context};
        if (conversationToken.buttons && conversationToken.buttons[text.toLowerCase()]) {
            const value = conversationToken.buttons[text.toLowerCase()];
            const {text: t, ...others} = value.input;
            return {userId, text: t, extra: {...extra, ...others}};
        }
    }

    return {userId, text, extra};
};

module.exports.alexa = async (req, res) => {
    const params = req.swagger.params;
    const body = params.body.value;

    try {
        const cert_url = req.headers['signaturecertchainurl'];
        const signature = req.headers['signature'];
        await verifier(cert_url, signature, JSON.stringify(req.body));
        const input = formatInput(body);
        if (input.extra.sessionEnd) {
            await Assistant.deleteSessionId(input.userId);
            log.info('Destroying sesssion of %s', input.userId);
            res.send({});
        } else {
            log.info('Received message from %s: %s %j', input.userId, input.text || '(empty)', input.extra);
            const r = await Assistant.sendMessage(input.userId, input.text, input.extra)
            log.info('Answering with messages to %s: %j', input.userId, r);
            res.send(formatResponse(r, body));
        }
    } catch (error) {
        log.error('ERROR', error);
        res.status(500).send(error);
    }
};
