const MongoClient = require("mongodb").MongoClient;
const q = require('q');
const credentials = require('./credentials.js');

const MongoURL = credentials.mlab.connString;

const insertPosts = function(posts, isUpsert) {

    var qPromise = q.defer();

    MongoClient.connect(MongoURL, function(err, db){

        if(err){
            console.log("Error!");
            console.log(err);
            return err;
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
                    upsert: true
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
        })

    });

    return qPromise.promise;
}

module.exports = {
    insertAll: insertPosts
}
