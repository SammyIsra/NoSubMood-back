const MongoClient = require("mongodb").MongoClient;
const q = require('q');
const credentials = require('./credentials.js');

const MongoURL = credentials.mlab.connString;

const insertPosts = function(posts, isUpsert) {

    var qPromise = q.defer();

    MongoClient.connect(MongoURL, function(err, db){

        if(err){
            console.log("Error!");
            qPromise.reject(err);
        }

        console.log("DB Reached");

        const postsList = db.collection('postlist');
        //Decide how to insert post/posts in collection

        var operations = posts.map((post)=>{
            return {
                updateOne: {
                    filter: {
                        _id: post._id
                    },
                    update: {
                        $set: post
                    },
                    upsert: isUpsert
                }
            }
        });

        console.log("Ready to do bulk write");
        postsList.bulkWrite(operations, function(err, data){
            if(err){
                console.log(err);
                qPromise.reject(err);
            }else{
                qPromise.resolve(data);
            }

            console.log("Closing connection to database");
            db.close();
        });

    });

    return qPromise.promise;
}

function fetchAllFromSubreddit(subreddit){

    var qPromise = q.defer();

    MongoClient.connect(MongoURL, function(err, db){

        if(err){
            console.log("Error!");
            qPromise.reject(err);
        }

        var query = {};

        if(subreddit){
            query.subreddit = subreddit.toLowerCase();
        }

        console.log("DB Reached");
        console.log("Querying subreddit: " + query.subreddit);

        const postsList = db.collection('postlist');

        postsList.find(query).toArray(function(err, result){
            if(err){
                qPromise.reject(err);
            } else {
                qPromise.resolve(result);
            }

            //Closing db
            db.close();
        });

        // postsList.find({}).forEach( function(e){
        //     e.subreddit = e.subreddit.toLowerCase();
        //     postsList.save(e)
        // })
    });

    return qPromise.promise;
}

module.exports = {
    insertAll: insertPosts,
    fetchAllFromSubreddit: fetchAllFromSubreddit
}
