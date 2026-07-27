import { MongoClient, type MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
// Close idle sockets before Atlas does and fail fast when the cluster is
// unreachable — a warm serverless instance otherwise trips over sockets the
// server has already dropped.
const options: MongoClientOptions = {
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 10_000,
};

// The client connects lazily on first operation and its pool recovers from
// dropped sockets on its own. Never connect eagerly at module scope: a
// cold-start blip would cache a rejected promise forever — every later
// request fails until the instance is recycled — and the unawaited
// rejection can kill the process.

// In development, reuse the client across HMR reloads to avoid exhausting
// the connection pool. In production, create a single shared client.
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  globalWithMongo._mongoClientPromise ??= Promise.resolve(
    new MongoClient(uri, options),
  );
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  clientPromise = Promise.resolve(new MongoClient(uri, options));
}

export default clientPromise;
