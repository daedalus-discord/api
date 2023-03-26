import db from "./db.js";

async function check_token(request, reply, key) {
    const auth = request.headers.authorization;

    if (!auth) {
        reply.fail("Missing auth.", 401);
        return true;
    }

    if (!auth.startsWith("Bearer ")) {
        reply.fail("Invalid auth: should be a bearer token.", 401);
        return true;
    }

    const token = await db.api_tokens.findOne({ token: auth.substring(7) });

    if (!token) {
        reply.fail("Invalid auth: token is invalid.", 401);
        return true;
    }

    if (token.guild !== "universal" && token.guild !== request.args.gid) {
        reply.fail("Invalid auth: token belongs to another guild.", 403);
        return true;
    }

    if (!token.scopes.includes("all") && !token.scopes.includes(key)) {
        reply.fail(`Invalid auth: missing scope ${key}.`, 403);
        return true;
    }

    request.token_data = token;

    return false;
}

export function api(key, fn) {
    return async (request, reply) => (await check_token(request, reply, key)) || fn(request, reply);
}

export async function autoinc(seq) {
    const document = await db.counters.findOneAndUpdate({ seq }, { $inc: { val: 1 } }, { upsert: true });
    return (document.value?.val ?? 0) + 1;
}
