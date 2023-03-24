import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const client = new MongoClient(process.env.DB_CONN_STRING);
await client.connect();
const db = client.db(process.env.DB_NAME);

export default new Proxy(
    {},
    {
        get(_, property) {
            return db.collection(property);
        },
    },
);
