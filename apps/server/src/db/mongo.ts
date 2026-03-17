import mongoose from "mongoose";

export async function connectMongo(mongoUri: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

export function mongoIsReady(): boolean {
  // 1 = connected, 2 = connecting
  return mongoose.connection.readyState === 1;
}

