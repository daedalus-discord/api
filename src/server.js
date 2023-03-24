import fastify_static from "@fastify/static";
import fastify_view from "@fastify/view";
import fastify from "fastify";
import { res } from "file-ez";
import pug from "pug";

const server = fastify({
    ignoreTrailingSlash: true,
    ajv: { customOptions: { coerceTypes: false, removeAdditional: true } },
});

const version = `?v=${Math.floor(Math.random() * 1000000)}`;

server
    .register(fastify_static, { root: res("static"), prefix: "/static" })
    .register(fastify_view, {
        engine: { pug },
        root: res("templates"),
        defaultContext: { config: process.env, version },
    })
    .addHook("preHandler", async function (request, reply) {
        console.log(`[${request.method}] ${request.url}`);

        request.args = {};
        request.token = request.headers.authorization?.substring(7);

        Object.entries(request.params).forEach(([key, value]) => (request.args[key] = value));

        reply.fail = (message, code) => reply.code(code ?? 400).send({ error: { statusCode: code ?? 400, message } });
    })
    .setErrorHandler((error, _, reply) => {
        console.error(error);
        reply.code(error?.statusCode ?? 500).send(JSON.stringify({ error }));
    });

export default server;
