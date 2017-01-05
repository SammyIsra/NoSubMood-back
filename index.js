const express = require('express');
const q = require('q');

const red = require('./redWrap.js');
const postsdb = require('./postsdb.js');
const watsonTone = require('./watsonTone.js');

//Set up app
var app = express();

//Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// GET to /submood.
// query.subreddit contains the subreddit fo fetch from
app.get('/submood', function(req, res){

    console.log("=======================\nGET to /submood\nArgs:");
    console.log(req.query);

    //Get the data that we have from param
    getAllPostsFromSubreddit(req.query.subreddit.toLowerCase())
    .then(function(data){

        //Table of moods
        var moodTable = data.map(function(item){

            var returned = {
                time: item.when
            };

            item.tone.tone_categories[0].tones.map(function(tone){
                returned[tone.tone_name] = tone.score
            });

            return returned;
        });

        //Sort them based on date
        moodTable.sort(function(first, second){
            return (first.time - second.time);
        });


        //Respond to caller
        res.send(moodTable);
    })
    .catch(function(err){
        res.send("Error!");
    })
});

app.listen(process.env.PORT, function(){
    console.log("Ready");
});

// Retrieve all post analysis from a subreddit in our DB
function getAllPostsFromSubreddit( subreddit ){

    var qPromise = q.defer();

    postsdb.fetchAllFromSubreddit(subreddit)
    .then(function(data){
        qPromise.resolve(data);
        console.log("Response count: " + data.length);
    })
    .catch(function(err){
        qPromise.reject(err);
        console.log(err);
    });

    return qPromise.promise;
}


//Analyze the mood of a subreddit
function analyzeSubreddit(subreddit, count){

    var posts = [];

    //Start authentication
    red.auth()
    .then(function(data){

        console.log("Authentication response:");
        console.log(data);

        //Search for the top N posts
        return red.findTopN(subreddit, count);
    })
    .then(function(data){

        //data is the array of the posts
        posts = data.map(function(cur){
            return {
                _id: cur.data.id,
                subreddit: cur.data.subreddit.toLowerCase(),
                is_self: cur.data.is_self,
                is_analized: false,
                body: cur.data.selftext,
                title: cur.data.title,
                when: cur.data.created_utc*1000 // * 1000 because it is seconds instead of miliseconds
            }
        });
        console.log(data[0]);
        console.log("Number of posts received: " + posts.length);
        console.log("Post sample:");
        console.log(posts[0]);

        //Analyze all the posts
        return watsonTone.analyzeManyPosts(posts);

    })
    .then(function(data){

        console.log("Sample of result of Watson: ");
        console.log(data[0]);
        console.log("Count: " + data.length);

        //Insert all the analyzed posts on our MongoDB
        return postsdb.insertAll(posts, true);
    })
    .then(function(data){
        console.log("Bulk write has finished");
        console.log(data);
    })
    .catch(function(error){
        console.log("Error:");
        console.log(error);
    })
    .done(function(){
        console.log("Done. Goodbye!");
    });
}
