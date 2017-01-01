const red = require('./redWrap.js');
const postsdb = require('./postsdb.js');
const watsonTone = require('./watsonTone.js');

var posts = [];

//Start authentication
red.auth()
.then(function(data){

    console.log("Authentication response:");
    console.log(data);

    //Search for the top N posts
    return red.findTopN(50);
})
.then(function(data){

    //data is the array of the posts
    posts = data.map(function(cur){
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

    //Analyze all the posts
    return watsonTone.analyzeManyPosts(posts);

})
.then(function(data){

    console.log("Sample of result of Watson: ");
    console.log(data[0]);
    console.log("Count: " + data.length);

    //Insert all the posts on out MongoDB
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
})
