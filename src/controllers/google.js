const log4js = require('log4js');
const log = log4js.getLogger('google');
const assert = require('assert').strict;
const jwt = require('jsonwebtoken');
const Assistant = require('../services/Assistant');


assert(process.env.JWT_SECRET, 'Missing environment var JWT_SECRET');
const jwtSecret = process.env.JWT_SECRET;


const storeButtonInContext = (conversationToken, option) => {
    if (!conversationToken.buttons) {
        conversationToken.buttons = {};
    } // salvo i pulsanti nel conversation token
    conversationToken.buttons[option.label] = option.value;
};


const formatResponse = (response, googleBody) => {
    let capabilities = [];
    if (googleBody && googleBody.surface && googleBody.surface.capabilities) {
        capabilities = googleBody.surface.capabilities.map((c) => c.name);
    }

    const conversationToken = {
        context: response.context.skills['main skill'].user_defined,
    };
    const richResponse = {
        items: [], // solo testo o rich response (card)
        suggestions: [], // pulsanti (max 8)
        linkOutSuggestion: undefined, // pulsante per andare verso una app o un url esterno
    };

    // disambiguazione: se c'è disambiguazione, ritorno solo questa
    const suggestion = response.output.generic.find((g) => g.response_type === 'suggestion');
    if (suggestion) {
        richResponse.items.push({
            simpleResponse: {
                textToSpeech: suggestion.title.trim(),
                displayText: suggestion.title.trim(),
            },
        });

        if (capabilities.includes('actions.capability.SCREEN_OUTPUT')) {
            richResponse.suggestions = suggestion.suggestions.map((o) => {
                storeButtonInContext(conversationToken, o);
                return {
                    title: o.label
                };
            });
        } else {
            richResponse.items.push({
                simpleResponse: {
                    textToSpeech: suggestion.suggestions.map((o) => o.label.trim()).join(', ').trim(),
                    displayText: '',
                },
            });
        }
    } else {
        let basicCard = 0;
        const maxBasicCard = 1;
        let simpleResponses = 0;
        const maxSimpleResponses = 2;
        const charsPerSimpleText = 640;

        // testi
        const texts = response.output.generic.filter((g) => g.response_type === 'text').map((g) => g.text);
        const simpleTexts = [];
        for (const t of texts) {
            if (simpleTexts.length === 0) {
                simpleTexts.push(t);
            } else {
                const addedT = '\n' + t;
                const lastItem = simpleTexts.length - 1;
                if (simpleTexts[lastItem].length + addedT.length < charsPerSimpleText) {
                    simpleTexts[lastItem] += addedT;
                } else {
                    simpleTexts.push(t);
                }
            }
        }
        for (const text of simpleTexts) {
            if (simpleResponses < maxSimpleResponses) {
                simpleResponses++;
                richResponse.items.push({
                    simpleResponse: {
                        textToSpeech: text,
                        displayText: text,
                    },
                });
            }
        }

        // gestione immagini: diventano una basicCard e hanno priorità sulla basicCard creata dai pulsanti
        if (capabilities.includes('actions.capability.SCREEN_OUTPUT')) {
            const images = response.output.generic.find((g) => g.response_type === 'image');
            if (images) {
                for (const img of images) {
                    if (basicCard < maxBasicCard) {
                        basicCard++;
                        richResponse.items.push({
                            basicCard: {
                                title: img.title,
                                formattedText: img.description,
                                image: {
                                    url: img.source,
                                }
                            },
                        });
                    }
                }
            }
        }

        // pulsanti
        const option = response.output.generic.find((g) => g.response_type === 'option');
        if (option) {
            let addTextButtons = true;
            if (capabilities.includes('actions.capability.SCREEN_OUTPUT')) {
                addTextButtons = false;
                richResponse.suggestions = option.options.map((o) => {
                    storeButtonInContext(conversationToken, o);
                    return {
                        title: o.label
                    };
                });
            }

            const title = option.title || '';
            const description = option.description || '';
            const buttons = addTextButtons ? '\n' + option.options.map((o) => o.label).join(', ').trim() : '';

            if (capabilities.includes('actions.capability.SCREEN_OUTPUT')
                && simpleResponses >= maxSimpleResponses && basicCard < maxBasicCard) {
                basicCard++;
                richResponse.items.push({
                    basicCard: {
                        title: title.trim(),
                        formattedText: description.trim() + buttons,
                    },
                });
            } else if (simpleResponses < maxSimpleResponses) {
                simpleResponses++;
                richResponse.items.push({
                    simpleResponse: {
                        textToSpeech: title.trim() + buttons,
                        displayText: (title + '\n' + description).trim(),
                    },
                });
            }
        }

        // link out button
        const connect_to_agent = response.output.generic.find((g) => g.response_type === 'connect_to_agent');
        if (connect_to_agent) {
            richResponse.linkOutSuggestion = {
                destinationName: connect_to_agent.message_to_human_agent,
                url: Assistant.getContextVar(response, '_externalUrl', 'https://assistant.google.com/'),
            };
        }
    }

    const expectUserResponse = Assistant.getContextVar(response, '_finalResponse', true);

    if (richResponse.items.length === 0) {
        richResponse.items.push({
            simpleResponse: {
                textToSpeech: 'Non sono presenti risposte di tipo testuali in questo nodo di dialogo',
            },
        });
    }

    const output = {
        conversationToken: jwt.sign(conversationToken, jwtSecret),
        expectUserResponse,
    };

    if (output.expectUserResponse) {
        output.expectedInputs = [{
            inputPrompt: {richInitialPrompt: richResponse},
            possibleIntents: [{intent: 'actions.intent.TEXT'}]
        }];
    } else {
        output.finalResponse = {richResponse: richResponse};
    }

    log.info('to google: %j', output);
    return output;
}

const formatInput = (body) => {
    log.info('from google - body: %j', body);

    const intent = body.inputs[0].intent;
    const userId = body.conversation.conversationId;
    const text = intent === 'actions.intent.MAIN' ? '' : body.inputs[0].rawInputs[0].query;

    let extra = {};
    if (body.conversation.conversationToken) {
        const conversationToken = jwt.verify(body.conversation.conversationToken, jwtSecret);
        extra = {context: conversationToken.context};
        if (conversationToken.buttons && conversationToken.buttons[text]) {
            const value = conversationToken.buttons[text];
            const {text: t, extra: e} = value.input;
            return {userId, text: t, extra: {...extra, ...e}};
        }
    }

    return {userId, text, extra};
};

module.exports.google = async (req, res) => {
    const params = req.swagger.params;
    const body = params.body.value;

    try {
        const input = formatInput(body);
        log.info('Received message from %s: %s %j', input.userId, input.text || '(empty)', input.extra);
        const r = await Assistant.sendMessage(input.userId, input.text, input.extra);
        log.info('Answering with messages to %s: %j', input.userId, r);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Google-Assistant-API-Version', 'v2');
        res.send(formatResponse(r, body));
    } catch (error) {
        log.error('ERROR', error);
        res.status(500).send(error);
    }
};


/*
{
  "user": {
    "locale": "it-IT",
    "lastSeen": "2020-09-14T15:19:12Z",
    "userVerificationStatus": "VERIFIED"
  },
  "conversation": {
    "conversationId": "ABwppHFsuAZKpHubv6FMpoOdILvZAOyPnFlCnduYV_I7WYJElJiNCYEmwtA563xRqo1GOT3s2FL9nxU2k8Xf",
    "type": "NEW"
  },
  "inputs": [
    {
      "intent": "actions.intent.MAIN",
      "rawInputs": [
        {
          "inputType": "VOICE",
          "query": "Parla con la mia app di prova"
        }
      ]
    }
  ],
  "surface": {
    "capabilities": [
      {
        "name": "actions.capability.MEDIA_RESPONSE_AUDIO"
      },
      {
        "name": "actions.capability.ACCOUNT_LINKING"
      },
      {
        "name": "actions.capability.SCREEN_OUTPUT"
      },
      {
        "name": "actions.capability.AUDIO_OUTPUT"
      }
    ]
  },
  "isInSandbox": true,
  "availableSurfaces": [
    {
      "capabilities": [
        {
          "name": "actions.capability.WEB_BROWSER"
        },
        {
          "name": "actions.capability.AUDIO_OUTPUT"
        },
        {
          "name": "actions.capability.SCREEN_OUTPUT"
        }
      ]
    }
  ],
  "requestType": "SIMULATOR"
}
*/


/*
{
  "user": {
    "locale": "it-IT",
    "lastSeen": "2020-09-14T15:51:59Z",
    "userVerificationStatus": "VERIFIED"
  },
  "conversation": {
    "conversationId": "ABwppHFsuAZKpHubv6FMpoOdILvZAOyPnFlCnduYV_I7WYJElJiNCYEmwtA563xRqo1GOT3s2FL9nxU2k8Xf",
    "type": "NEW"
  },
  "inputs": [
    {
      "intent": "actions.intent.TEXT",
      "rawInputs": [
        {
          "inputType": "VOICE",
          "query": "vorrei una pizza"
        }
      ],
      "arguments": [
        {
          "name": "text",
          "rawText": "vorrei una pizza",
          "textValue": "vorrei una pizza"
        }
      ]
    }
  ],
  "surface": {
    "capabilities": [
      {
        "name": "actions.capability.AUDIO_OUTPUT"
      },
      {
        "name": "actions.capability.SCREEN_OUTPUT"
      },
      {
        "name": "actions.capability.ACCOUNT_LINKING"
      },
      {
        "name": "actions.capability.MEDIA_RESPONSE_AUDIO"
      }
    ]
  },
  "isInSandbox": true,
  "availableSurfaces": [
    {
      "capabilities": [
        {
          "name": "actions.capability.WEB_BROWSER"
        },
        {
          "name": "actions.capability.SCREEN_OUTPUT"
        },
        {
          "name": "actions.capability.AUDIO_OUTPUT"
        }
      ]
    }
  ],
  "requestType": "SIMULATOR"
}

*/