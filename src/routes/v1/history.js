import schemas from "../../schemas.js";
import { api, autoinc } from "../../utils.js";

export default function (server, _, done) {
    server.get(
        "/moderation/history/:gid/user/:uid",
        { schema: schemas.v1.GET_history },
        api("moderation:history:get", async (request, _) => {
            const page = parseInt(request.query.page ?? "1");
            const filter = { guild: request.args.gid, user: request.args.uid };
            const count = await db.history.countDocuments(filter);
            const items = await db.history
                .find(filter)
                .skip((page - 1) * 100)
                .limit(100)
                .toArray();

            items.forEach((x) => delete x._id);

            return { items, count, more: count > page * 100 };
        }),
    );

    server.get(
        "/moderation/history/:gid/id/:id(^[1-9][0-9]*$)",
        api("moderation:history:get", async (request, reply) => {
            const item = await db.history.findOne({ guild: request.args.gid, id: parseInt(request.args.id) });

            if (!item) return reply.fail("No history entry with that ID.", 404);

            delete item._id;
            return item;
        }),
    );

    server.post(
        "/moderation/history/:gid/user/:uid",
        { schema: schemas.v1.POST_history },
        api("moderation:history:append", async (request, reply) => {
            const mod =
                (request.token_data.scopes.includes("all") ||
                request.token_data.scopes.includes("moderation:history:append:id")
                    ? request.body.mod
                    : null) ?? request.token_data.id;

            const data = {
                guild: request.args.gid,
                user: request.args.uid,
                id: await autoinc(`history/${request.args.gid}`),
                type: request.body.type,
                mod,
                time: new Date(),
                duration: request.body.duration || Infinity,
                origin: request.body.origin,
                reason: request.body.reason,
            };

            const { acknowledged } = await db.history.insertOne(structuredClone(data));

            if (!acknowledged) return reply.fail("Could not insert entry.", 500);

            return data;
        }),
    );

    server.delete(
        "/moderation/history/:gid/id/:id(^[1-9][0-9]*$)",
        api("moderation:history:delete", async (request, reply) => {
            const entry = await db.history.findOneAndDelete({ guild: request.args.gid, id: parseInt(request.args.id) });

            if (!entry.value) return reply.fail("No history entry with that ID.", 404);

            delete entry.value._id;
            return entry.value;
        }),
    );

    done();
}
