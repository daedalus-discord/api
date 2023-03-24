import { res } from "file-ez";
import { readFileSync } from "fs";
import { parse } from "yaml";
import server from "./server.js";

import v1 from "./routes/v1/index.js";
import schemas from "./schemas.js";

const versions = { v1: "Version 1 (stable)" };
const data = { v1 };

Object.keys(versions).forEach(async (version_key) => {
    data[version_key].forEach((plugin) => server.register(plugin, { prefix: `/${version_key}` }));
    const yml_data = parse(readFileSync(res(`docs/${version_key}.yml`), "utf-8"));

    server.get(`/docs/${version_key}`, async (_, reply) =>
        reply.view("docs.pug", { version_name: versions[version_key], data: yml_data, schemas: schemas[version_key] }),
    );
});

server.get("/", async (_, reply) => reply.view("index.pug", { versions }));

await server.listen({ port: parseInt(process.env.PORT ?? 5001) });
console.log(`${process.env.DOMAIN} started at :${process.env.PORT ?? 5001}`);

process.on("uncaughtException", console.error);
