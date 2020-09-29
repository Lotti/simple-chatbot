const log4js = require('log4js');
const log = log4js.getLogger('alexa');
const assert = require('assert').strict;
const jwt = require('jsonwebtoken');
const verifier = require('alexa-verifier');
const Assistant = require('../services/Assistant');


assert(process.env.JWT_SECRET, 'Missing environment var JWT_SECRET');
const jwtSecret = process.env.JWT_SECRET;


const storeButtonInContext = (conversationToken, option) => {
    if (!conversationToken.buttons) {
        conversationToken.buttons = {};
    } // salvo i pulsanti nel conversation token
    conversationToken.buttons[option.label.toLowerCase()] = option.value;
};


const formatResponse = (response, alexaBody) => {
    let capabilities = [];

    if (alexaBody && alexaBody.context && alexaBody.context.System) {
        capabilities = Object.keys(alexaBody.context.System.device.supportedInterfaces);
    }

    const conversationToken = {
        context: response.context.skills['main skill'].user_defined,
    };

    let text = '';
    let title = undefined;
    let card = undefined;
    let cards = 0;
    let maxCards = 1;

    // disambiguazione: se c'è disambiguazione, ritorno solo questa
    const suggestion = response.output.generic.find((g) => g.response_type === 'suggestion');
    if (suggestion) {
        text = suggestion.title;
        const buttons = suggestion.suggestions.map((o) => {
            storeButtonInContext(conversationToken, o);
            return o.label.trim();
        }).join(', ');
        if (capabilities.includes('Display')) {
            card = {
                title: suggestion.title,
                text: buttons,
            };
        } else {
            text+= '\n'+buttons;
        }
    } else {

        // testi
        const texts = response.output.generic.filter((g) => g.response_type === 'text').map((g) => g.text);
        for (const t of texts) {
            text+= `${text.length > 0 ? '\n': ''}${t}`;
        }

        // gestione immagini: trasformano una SimpleCard in StandardCard
        if (capabilities.includes('Display')) {
            const img = response.output.generic.find((g) => g.response_type === 'image');
            if (img) {
                cards++;
                card = {
                    title: img.title,
                    text: img.description,
                    url: img.source,
                }
            }
        }

        // pulsanti
        const option = response.output.generic.find((g) => g.response_type === 'option');
        if (option) {
            const title = option.title || '';
            const description = option.description || '';
            const buttons = option.options.map((o) => {
                storeButtonInContext(conversationToken, o);
                return o.label.trim();
            }).join(', ');

            if (capabilities.includes('Display') && cards < maxCards) {
                cards++;
                card = {
                    title: title.trim(),
                    text: description.trim() + '\n' + buttons,
                };
            } else {
                text+= `${text.length > 0 ? '\n': ''}${title}`;
                text+= `${text.length > 0 ? '\n': ''}${description}`;
                text+= `${text.length > 0 ? '\n': ''}${buttons}`;
            }
        }

        // link out button -> Not supported in Alexa?
        const connect_to_agent = response.output.generic.find((g) => g.response_type === 'connect_to_agent');
        if (connect_to_agent) {
            /*
            richResponse.linkOutSuggestion = {
                destinationName: connect_to_agent.message_to_human_agent,
                url: Assistant.getContextVar(response, '_externalUrl', 'https://assistant.google.com/'),
            };
            */
        }
    }

    const finalResponse = Assistant.getContextVar(response, '_finalResponse', false);

    if (text.length === 0) {
        text = 'Non sono presenti risposte di tipo testuali in questo nodo di dialogo';
    }

    const output = {
        version: '1.0',
        sessionAttributes: {
            conversationToken: jwt.sign(conversationToken, jwtSecret),
        },
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: text,
                playBehavior: 'ENQUEUE',
            },
            card: {
                type: card ? 'Standard' : 'Simple',
                title: card ? card.title : title,
                [card ? 'text' : 'content']: card ? card.text : text,
                image: card && card.url ? {smallImageUrl: card.url, largeImageUrl: card.url,} : undefined,
            },
            directives: [
                /*
                {
                    type: "Display.RenderTemplate",
                    template: {
                        type: "BodyTemplate1",
                        token: "horoscope",
                        title: "This is your horoscope",
                        image: {
                            contentDescription: "Aquarius",
                            sources: [
                                {
                                    url: "https://example.com/resources/card-images/aquarius-symbol.png"
                                }
                            ]
                        },
                        textContent: {
                            primaryText: {
                                type: "RichText",
                                text: "You are going to have a <b>good day</b> today."
                            }
                        }
                    }
                }
                */
            ],
            shouldEndSession: finalResponse,
        }
    };

    if (!finalResponse) {
        output.response.reprompt = {
            outputSpeech: {
                type: "PlainText",
                text: text,
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
    if (request.type === 'SessionEndedRequest') {
        extra = {sessionEnd: true};
    } else if (request.type === 'IntentRequest' && request.intent.name === 'watson') {
        if (request.intent && request.intent.slots &&
            request.intent.slots.speech && request.intent.slots.speech.value) {
            text = request.intent.slots.speech.value
        }
    }

    if (body.session.attributes.conversationToken) {
        const conversationToken = jwt.verify(body.session.attributes.conversationToken, jwtSecret);
        extra = {...extra, context: conversationToken.context};
        if (conversationToken.buttons && conversationToken.buttons[text.toLowerCase()]) {
            const value = conversationToken.buttons[text];
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
