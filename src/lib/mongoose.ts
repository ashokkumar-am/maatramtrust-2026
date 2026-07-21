import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Cache the connection across HMR reloads in development and across serverless
// invocations in production to avoid exhausting the connection pool.
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalWithMongoose._mongooseCache) {
  globalWithMongoose._mongooseCache = cached;
}

async function connectMongoDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectMongoDB;
