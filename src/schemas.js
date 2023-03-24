const pos_num = { type: "string", pattern: "&[1-9][0-9]*$" };
const reason = { type: "string", maxLength: 512 };
const msg_url = { type: "string", pattern: "https://((ptb|canary)\\.)?discord\\.com/channels/\\d+/\\d+/\\d+" };
const id = { type: "string", pattern: "^\\d{17,20}$" };

const xp_item = {
    type: "object",
    required: ["mode", "amount"],
    additionalProperties: false,
    properties: { mode: { enum: ["set", "add"] }, amount: { type: "number" } },
};

export default {
    v1: {
        GET_history: { querystring: { type: "object", additionalProperties: false, properties: { page: pos_num } } },
        POST_history: {
            body: {
                anyOf: [
                    {
                        type: "object",
                        required: ["type", "duration"],
                        additionalProperties: false,
                        properties: {
                            type: { enum: ["ban", "mute"] },
                            mod: id,
                            duration: { type: "number" },
                            origin: msg_url,
                            reason,
                        },
                    },
                    {
                        type: "object",
                        required: ["type", "duration"],
                        additionalProperties: false,
                        properties: {
                            type: { const: "timeout" },
                            mod: id,
                            duration: { type: "number", maximum: 28 * 24 * 60 * 60 * 1000 },
                            origin: msg_url,
                            reason,
                        },
                    },
                    {
                        type: "object",
                        required: ["type"],
                        additionalProperties: false,
                        properties: { type: { enum: ["kick"] }, mod: id, origin: msg_url, reason },
                    },
                    {
                        type: "object",
                        required: ["type", "reason"],
                        additionalProperties: false,
                        properties: { type: { enum: ["warn", "informal_warn"] }, mod: id, origin: msg_url, reason },
                    },
                ],
            },
        },
        GET_xp_leaderboard: {
            querystring: {
                type: "object",
                additionalProperties: false,
                properties: {
                    page: pos_num,
                    sort: {
                        enum: ["daily", "weekly", "monthly", "total"]
                            .flatMap((x) => [`${x}.text`, `${x}.voice`])
                            .flatMap((x) => [x, `-${x}`]),
                    },
                },
            },
        },
        PATCH_xp: {
            body: {
                type: "array",
                items: {
                    type: "object",
                    required: ["user"],
                    additionalProperties: false,
                    properties: { user: id, text: xp_item, voice: xp_item },
                },
            },
        },
    },
};
