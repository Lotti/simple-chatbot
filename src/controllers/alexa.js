const log4js = require('log4js');
const log = log4js.getLogger('alexa');

const verifier = require('alexa-verifier');
const Assistant = require('../services/Assistant');

const formatResponse = (response, alexaBody) => {
    let capabilities = [];

    if (alexaBody && alexaBody.context && alexaBody.context.System) {
        capabilities = Object.keys(alexaBody.context.System.device.supportedInterfaces);
    }

    let context = {};
    if (response.context && response.context.skills && response.context.skills['main skill']) {
        context = response.context.skills['main skill'].user_defined;
    }

    let text = '';
    let title = undefined;
    let image = undefined;
    let cards = 0;
    let maxCards = 1;

    // disambiguazione: se c'è disambiguazione, ritorno solo questa
    const suggestion = response.output.generic.find((g) => g.response_type === 'suggestion');
    if (suggestion) {
        text = suggestion.title.trim();

        if (capabilities.includes('Display')) {
            /*
            richResponse.suggestions = suggestion.suggestions.map((o) => {
                storeButtonInContext(conversationToken, o);
                return {
                    title: o.label
                };
            });
            */
        } else {
            text+= '\n'+suggestion.suggestions.map((o) => o.label.trim()).join(', ').trim();
        }
    } else {

        // testi
        const texts = response.output.generic.filter((g) => g.response_type === 'text').map((g) => g.text);
        for (const t of texts) {
            text+= t;
        }

        // gestione immagini: trasformano una SimpleCard in StandardCard
        if (capabilities.includes('Display')) {
            const img = response.output.generic.find((g) => g.response_type === 'image');
            if (img) {
                image = {
                    title: img.title,
                    text: img.description,
                    url: img.source,
                }
            }
        }

        // pulsanti
        const option = response.output.generic.find((g) => g.response_type === 'option');
        if (option) {
            let addTextButtons = true;
            if (capabilities.includes('Display')) {
                addTextButtons = false;
                /*
                richResponse.suggestions = option.options.map((o) => {
                    storeButtonInContext(conversationToken, o);
                    return {
                        title: o.label
                    };
                });
                */
            }

            const title = option.title || '';
            const description = option.description || '';
            const buttons = addTextButtons ? '\n' + option.options.map((o) => o.label).join(', ').trim() : '';

            if (capabilities.includes('Display') && cards < maxCards) {
                cards++;
                /*
                richResponse.items.push({
                    basicCard: {
                        title: title.trim(),
                        formattedText: description.trim() + buttons,
                    },
                });
                */
            } else {
                /*
                richResponse.items.push({
                    simpleResponse: {
                        textToSpeech: title.trim() + buttons,
                        displayText: (title + '\n' + description).trim(),
                    },
                });
                */
            }
        }

        // link out button
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

    const expectUserResponse = Assistant.getContextVar(response, '_finalResponse', true);

    if (text.length === 0) {
        text = 'Non sono presenti risposte di tipo testuali in questo nodo di dialogo';
    }

    const output = {
        version: '1.0',
        sessionAttributes: context,
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: text,
                playBehavior: 'ENQUEUE',
            },
            card: {
                type: image ? 'Standard' : 'Simple',
                title: image ? image.title : title,
                [image ? 'text' : 'content']: image ? image.text : text,
                image: image ? {smallImageUrl: image.url, largeImageUrl: image.url,} : undefined,
            },
            /*
            directives: [
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
            ],
            */
            shouldEndSession: expectUserResponse,
        }
    };

    if (!expectUserResponse) {
        output.response.reprompt = {
            outputSpeech: {
                type: "PlainText",
                text: text,
                playBehavior: "REPLACE_ENQUEUED"
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
    const context = body.session.attributes;
    let extra = {};
    let text = '';

    if (request.type === 'IntentRequest' && request.intent.name === 'watson') {
        if (request.intent && request.intent.slots &&
            request.intent.slots.speech && request.intent.slots.speech.value) {
            text = request.intent.slots.speech.value
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
        log.info('Received message from %s: %s %j', input.userId, input.text || '(empty)', input.extra);
        const r = await Assistant.sendMessage(input.userId, input.text, input.extra)
        log.info('Answering with messages to %s: %j', input.userId, r);
        res.send(formatResponse(r, body));
    } catch (error) {
        log.error('ERROR', error);
        res.status(500).send(error);
    }
};
