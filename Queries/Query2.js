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

  //initializing favorites sum (creating key and setting to zero)
  await redisClient.set("favoritesSum", 0);

  //goes through tweets in the database
  const tweetsCursor = tweetsCollection.find({}); //queries all tweets

  for await (const tweet of tweetsCursor) {
  await redisClient.incrBy("favoritesSum", tweet.favorite_count || 0); //increments by number of favorites
  }

  //last total of favorites
  const totalFavorites = await redisClient.get("favoritesSum");
  console.log(`The total number of favorites is ${totalFavorites}`); //prints total favorites

  //close connections
  await mongoClient.close();
  await redisClient.quit();
}

run();