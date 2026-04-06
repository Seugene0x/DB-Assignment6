//connecting to mongo database using docker
import { MongoClient } from "mongodb";
import { createClient } from "redis";
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017");

async function run() {
  await mongoClient.connect();
  const db = mongoClient.db("ieeevisTweets"); 
  const tweetsCollection = db.collection("tweet");

  //connecting to redis desktop
  const redisClient = createClient({
    url: "redis://127.0.0.1:6379"
  });
  await redisClient.connect();

  //initialize Redis set for distinct screen names
  const setKey = "screen_names";

  //go through tweets in the database
  const tweetsCursor = tweetsCollection.find({}); //queries all tweets

  for await (const tweet of tweetsCursor) {
    if (tweet.user && tweet.user.screen_name) {
      await redisClient.sAdd(setKey, tweet.user.screen_name); //sadd adds a value to the redis set only if its not there
    }
  }

  //get total number of distinct users
  const distinctUsers = await redisClient.sCard(setKey); //sCard returns the unique elements in the set
  console.log(`There are ${distinctUsers} distinct users in the dataset`);

  //close connections
  await mongoClient.close();
  await redisClient.quit();
}

run();