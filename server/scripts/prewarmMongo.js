import { MongoMemoryServer } from 'mongodb-memory-server';

const prewarm = async () => {
  const mongod = await MongoMemoryServer.create();
  await mongod.stop();
  console.log('MongoDB binary cached for offline use');
};

prewarm().catch((err) => {
  console.error('Failed to prewarm MongoDB binary:', err);
  process.exit(1);
});
