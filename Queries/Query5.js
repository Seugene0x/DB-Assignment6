//connecting to mongo database from assignment 5 using docker
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

  //go through tweets in the database
  const tweetsCursor = tweetsCollection.find({}); //queries all tweets

  for await (const tweet of tweetsCursor) {
    if (tweet.user && tweet.user.screen_name)
    {
      const screenName = tweet.user.screen_name;
      const tweetId = tweet._id.toString(); // convert Mongos ObjectId to a string for redis

      //Add tweet ID to the user's list
      await redisClient.rPush(`tweets:${screenName}`, tweetId);

      //Store tweet info in a hashmap
      // flatten the tweet fields you want
      await redisClient.hSet(`tweet:${tweetId}`, {
        user_name: tweet.user.screen_name,
        text: tweet.text || "",
        created_at: tweet.created_at || "",
        favorites: tweet.favorite_count.toString(),
        retweets: tweet.retweet_count.toString()
      });
    }
  }

  console.log("User tweet lists and tweet hashes created in Redis.");

  //close connections
  await mongoClient.close();
  await redisClient.quit();
}

run();