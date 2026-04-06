//connecting to mongo database using docker
import { MongoClient } from "mongodb";
import { createClient } from "redis";
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017");

async function run() {
  await mongoClient.connect();
  const db = mongoClient.db("ieeevisTweets");
  const tweetsCollection = db.collection("tweet");

  const redisClient = createClient({
    url: "redis://127.0.0.1:6379"
  });
  await redisClient.connect();

  // initializing tweet count (creating key and setting to zero)
  await redisClient.set("tweetCount", 0);

  // goes through tweets in the database
  const tweetsCursor = tweetsCollection.find({});

  for await (const tweet of tweetsCursor) {
    await redisClient.incr("tweetCount");
  }

  // last count of tweets
  const finalCount = await redisClient.get("tweetCount");
  console.log(`There were ${finalCount} tweets`);

  await mongoClient.close();
  await redisClient.quit();
}

run();


