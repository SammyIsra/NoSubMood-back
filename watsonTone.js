const watson = require('watson-developer-cloud');
const q = require('q');
const throat = require('throat');

const credentials = require('./credentials.js');

//Credentials and stuff
var tone_analyzer = watson.tone_analyzer({
  username: credentials.watson.username,
  password: credentials.watson.password,
  version: 'v3',
  version_date: '2016-05-19'
});

function analyzeSinglePost(post){

    var qPromise = q.defer();

    var textToAnalyze;

    //Depending on the type, assemble text
    if(post.is_self){
        textToAnalyze = `${post.title} - ${post.body}`;
    }else{
        textToAnalyze = post.title;
    }

    console.log("About to analyze text");
    //Make the request to Watson
    tone_analyzer.tone({
        text: textToAnalyze,
        sentences: false
    }, function(err, tone){
        if(err){
            console.log("Error when calling Watson");
            qPromise.reject(err);
        }else{
            post.tone = tone.document_tone;
            post.is_analized = true;
            qPromise.resolve(post);
        }
    });

    return qPromise.promise;
}

function analyzeManyPosts(posts){

    var qPromise = q.defer();

    const count = posts.length;

    //Limit to 50 calls at a time
    var promList = posts.map(throat(function(post, i){
        console.log(i);
        return analyzeSinglePost(post);
    }, 50));

    //Return a collection of all promises
    return q.all(promList);
}

module.exports = {
    analyzeSinglePost: analyzeSinglePost,
    analyzeManyPosts: analyzeManyPosts
}
