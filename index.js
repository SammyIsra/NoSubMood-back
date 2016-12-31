const red = require('./redWrap.js');
const postsdb = require('./postsdb.js');
const watsonTone = require('./watsonTone.js');

red.auth()
.then(function(data){

    console.log("Authentication response:");
    console.log(data);

    //Returning a promise
    return red.findTopN(500);
})
.then(function(data){
    //data is the array of the posts
    var posts = data.map(function(cur){
        return {
            _id: cur.data.id,
            is_self: cur.data.is_self,
            body: cur.data.selftext,
            title: cur.data.title,
            when: cur.data.created_utc*1000 // * 1000 because it is seconds instead of miliseconds
        }
    });

    console.log("Number of posts received: " + posts.length);
    console.log("Post sample:");
    console.log(posts[0]);

    //At this point, posts is a list of the top n posts on a subreddit
    // We are returning a promise
    return postsdb.insertAll(posts, false)
})
.then(function(data){
    console.log("Bulk write has finished");
    console.log(data);
})
.catch(function(error){
    console.log("Error:");
    console.log(error);
})
