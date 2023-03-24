import db from "../../db.js";
import schemas from "../../schemas.js";
import { api } from "../../utils.js";

export default function (server, _, done) {
    server.get(
        "/xp/:gid/user/:uid",
        api("xp:get", async (request) => {
            const data = await db.xp_amounts.findOne({ guild: request.args.gid, user: request.args.uid });

            if (!data)
                return ["daily", "weekly", "monthly", "total"].reduce(
                    (o, key) => ({ ...o, [key]: { text: 0, voice: 0 } }),
                    {},
                );

            delete data._id;
            delete data.guild;
            delete data.user;

            return data;
        }),
    );

    server.get(
        "/xp/:gid/leaderboard",
        { schema: schemas.v1.GET_xp_leaderboard },
        api("xp:get", async (request) => {
            const page = parseInt(request.query.page ?? "1");
            const filter = { guild: request.args.gid };
            const count = await db.xp_amounts.countDocuments(filter);
            const key = request.query.sort ?? "total.text";

            const items = await db.xp_amounts
                .find(filter)
                .sort(key.startsWith("-") ? key.substring(1) : key, key.startsWith("-") ? 1 : -1)
                .skip((page - 1) * 100)
                .limit(100)
                .toArray();

            items.forEach((x) => {
                delete x._id;
                delete x.guild;
            });

            return { items, count, more: count > page * 100 };
        }),
    );

    server.patch(
        "/xp/:gid",
        { schema: schemas.v1.PATCH_xp },
        api("xp:write", async (request) => {
            for (const entry of request.body) {
                const query = { guild: request.args.gid, user: entry.user };

                await db.xp_amounts.findOneAndUpdate(
                    query,
                    {
                        $setOnInsert: {
                            daily: { text: 0, voice: 0 },
                            weekly: { text: 0, voice: 0 },
                            monthly: { text: 0, voice: 0 },
                            total: { text: 0, voice: 0 },
                        },
                    },
                    { upsert: true },
                );

                for (const key of ["text", "voice"]) {
                    if (key in entry) {
                        if (entry[key].mode === "set") {
                            const old = await db.xp_amounts.findOneAndUpdate(query, {
                                $set: { total: { [key]: entry[key].amount } },
                            });

                            const diff = entry[key].amount - old.value.total[key];

                            await db.xp_amounts.findOneAndUpdate(query, {
                                $inc: { [`daily.${key}`]: diff, [`weekly.${key}`]: diff, [`monthly.${key}`]: diff },
                            });
                        } else if (entry[key].mode === "add") {
                            await db.xp_amounts.findOneAndUpdate(query, {
                                $inc: {
                                    [`daily.${key}`]: entry[key].amount,
                                    [`weekly.${key}`]: entry[key].amount,
                                    [`monthly.${key}`]: entry[key].amount,
                                    [`total.${key}`]: entry[key].amount,
                                },
                            });
                        }
                    }
                }
            }

            return { acknowledged: true };
        }),
    );

    done();
}
