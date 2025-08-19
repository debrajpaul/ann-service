import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connect(url: string, dbName: string): Promise<Db> {
  client = new MongoClient(url);
  await client.connect();
  db = client.db(dbName);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

export async function close(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
}
