import { MongooseModule } from '@nestjs/mongoose';

export const rootMongooseTestModule = (options: any) =>
  MongooseModule.forRootAsync({
    useFactory: async () => {
      return {
        uri: process.env.MONGO_URL,
        ...options,
      };
    },
  });

export const closeInMongodConnection = async () => {};
