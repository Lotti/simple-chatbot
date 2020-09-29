const log4js = require('log4js');
const assert = require('assert').strict;

const AssistantV2 = require('ibm-watson/assistant/v2');
const {BasicAuthenticator, IamAuthenticator} = require('ibm-watson/auth');

class Assistant {
    constructor() {
        let authenticator;
        if (process.env.ASSISTANT_APIKEY) {
            authenticator = new IamAuthenticator({ apikey: process.env.ASSISTANT_APIKEY });
        } else {
            assert(process.env.ASSISTANT_USERNAME, 'Missing environment var ASSISTANT_USERNAME');
            assert(process.env.ASSISTANT_PASSWORD, 'Missing environment var ASSISTANT_PASSWORD');
            authenticator = new BasicAuthenticator({ username: process.env.ASSISTANT_USERNAME, password: process.env.ASSISTANT_PASSWORD });
        }

        assert(process.env.ASSISTANT_URL, 'Missing environment var ASSISTANT_URL');
        assert(process.env.ASSISTANT_ID, 'Missing environment var ASSISTANT_ID');
        this.assistantId = process.env.ASSISTANT_ID;

        this.service = new AssistantV2({
            authenticator: authenticator,
            url: process.env.ASSISTANT_URL,
            version: '2020-04-01',
            headers: {
                'X-Watson-Learning-Opt-Out': 'true',
            },
        });

        this.sessions = {};
    }

    /**
     *
     * @param {string} userId
     */
    async deleteSessionId(userId) {
        const log = log4js.getLogger('Assistant::deleteSessionId');
        if (this.sessions[userId]) {
            try {
                await this.service.deleteSession({
                    assistantId: process.env.ASSISTANT_ID, 
                    sessionId: this.sessions[userId]
                });
            } catch (error) {
                log.warn(error.message);
            }
            delete this.sessions[userId];
        }
    }

    /**
     *
     * @param {user} userId
     * @returns {Promise<string>}
     */
    async getSessionId(userId) {
        const log = log4js.getLogger('Assistant::getSessionId');

        if (this.sessions[userId]) {
            return this.sessions[userId];
        } else {
            try {
                const response = await this.service.createSession({assistantId: process.env.ASSISTANT_ID});
                this.sessions[userId] = response.result.session_id;
                log.info('Created session %s for user %s', this.sessions[userId], userId);
                return this.sessions[userId];
            } catch (error) {
                log.error(error);
                throw error;
            }
        }
    }

    /**
     *
     * @param {AssistantV2.MessageResponse} response
     * @returns {AssistantV2.MessageResponse}
     * @private
     */
    _responseManipulation(response) {
        const log = log4js.getLogger('Assistant::_responseManipulation');
        if (response.context && response.context.skills && response.context.skills['main skill'].user_defined) {
            const context = response.context.skills['main skill'].user_defined;
            const intent = response.output.intents[0];
            if (intent && context.ItsConfidenceTreshold && intent.confidence >= context.ItsConfidenceTreshold) {
                context.ItsMisunderstandingCount = 0;
                log.info('ItsMisunderstandingCount was reset');
            }
        }

        return response;
    }


    /**
     *
     * @param {string} userId
     * @param {string} text
     * @param {object} extra
     * @param {string?} extra.suggestion_id
     * @param {object[]?} extra.intents
     * @param {object[]?} extra.entities
     * @param {object?} extra.context
     * @returns {Promise<AssistantV2.MessageResponse|{output: {generic: [{response_type: string, text: string}]}}>}
     */
    async sendMessage(userId, text, extra) {
        const log = log4js.getLogger('Assistant::sendMessage');

        let restart = false;
        if (['restart','ricomincia','riavvia'].includes(text.toLowerCase().trim())) {
            text = '';
            restart = true;
        }

        try {
            const options = {
                assistantId: this.assistantId,
                sessionId: await this.getSessionId(userId),
                input: {
                    text: text.replace(/[\t\n\r]/g, ' ').trim(),
                    message_type: 'text',
                    options: {
                        restart,
                        alternate_intents: true,
                        return_context: true,
                    }
                },
            };
            if (extra.suggestion_id) {
                options.input.suggestion_id = extra.suggestion_id;
            }
            if (extra.intents) {
                options.input.intents = extra.intents;
            }
            if (extra.entities) {
                options.input.entities = extra.entities;
            }
            if (extra.context) {
                if (extra.context._toClear && Array.isArray(extra.context._toClear) && extra.context._toClear.length > 0) {
                    for (const c of extra.context._toClear) {
                        extra.context[c] = null;
                    }
                }

                const keys = Object.keys(extra.context);
                for (const k of keys) {
                    if (k.startsWith('_')) {
                        extra.context[k] = null;
                    }
                }

                options.context = {
                    skills: {
                        ['main skill']: {
                            user_defined: extra.context
                        }
                    }
                };
            }

            return this._responseManipulation((await this.service.message(options)).result);
        } catch (error) {
            log.error(error);
            let text = 'Impossibile contattare Watson Assistant, provare di più tardi.';
            if (error.message === 'Invalid Session') {
                text = 'Sessione scaduta';
                await this.deleteSessionId(userId);
                log.fatal('invoking again sendmessage because session was expired');
                const result = await this.sendMessage(userId, text, extra);
                result.output.generic.unshift({response_type: 'text', text});
                return result;
            }
            return {
                output: {generic: [{response_type: "text", text}]},
                context: {skills:{['main skill']:{user_defined: {}}}},
            };
        }
    }

    getContextVar(response, varName, defaultValue) {
        if (response.context && response.context.skills && response.context.skills['main skill']
            && response.context.skills['main skill'].user_defined
            && response.context.skills['main skill'].user_defined[varName]) {
            if (response.context.skills['main skill'].user_defined[varName] !== null) {
                return response.context.skills['main skill'].user_defined[varName];
            } else {
                return defaultValue;
            }
        } else {
            return defaultValue;
        }
    };
}

module.exports = new Assistant();