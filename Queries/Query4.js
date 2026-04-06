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

  //initialize sorted set for leaderboard
  const leaderboardKey = "leaderboard";

  //go through tweets in the database
  const tweetsCursor = tweetsCollection.find({}); //queries all tweets

  for await (const tweet of tweetsCursor) {
    if (tweet.user && tweet.user.screen_name) {
      const screenName = tweet.user.screen_name;
      //increment user's score in the leaderboard by 1
      await redisClient.zIncrBy(leaderboardKey, 1, screenName);
        //adds 1 to the score of screenName each time a tweet is processed.
    }
  }

  //gets the top 10 users with most tweets from highest to lowest
  const topUsers = await redisClient.zRangeWithScores(leaderboardKey, 0, 9, { REV: true });

  console.log("Top 10 users with most tweets:");
  topUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.value} - ${user.score} tweets`);
  });

  //close connections
  await mongoClient.close();
  await redisClient.quit();
}

run();