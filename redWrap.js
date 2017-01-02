const request = require('request');
const q = require('q');
const credentials = require('./credentials.js');

var token = {};
var the_headers = {};

function authenticate(){

    var qPromise = q.defer();

    const client_auth = {
        'user': credentials.reddit.user,
        'pass': credentials.reddit.pass
    };

    const post_data = {
        "grant_type": "password",
        "username": credentials.reddit.username,
        "password": credentials.reddit.password
    };

    const post_headers = {
        "User-Agent": "ChangeMeClient/01 by "+credentials.reddit.username
    }


    request({
        method: 'POST',
        url: "https://www.reddit.com/api/v1/access_token",
        auth: client_auth,
        headers: post_headers,
        form: post_data
    }, function(error, response, body){
        if(error){
            //Error has ocurred
            qPromise.reject(error);
        }else{
            //Call was successful
            token = JSON.parse(body);
            the_headers = {
                "Authorization": "bearer " + token.access_token,
                "User-Agent": "ChangeMeClient/01 by Scharute"
            };
            qPromise.resolve(response.statusCode);
        }
    });

    return qPromise.promise;
}

//Who is the person requesting
function whoami(){

    var qPromise = q.defer();

    //console.log(the_headers);
    request({
        method: "GET",
        url: "https://oauth.reddit.com/api/v1/me",
        headers: the_headers,
    }, function(error, response, body){
        if(error){
            qPromise.reject(error);
            console.log(error);
        } else {
            qPromise.resolve(JSON.parse(body));
        }
    })

    return qPromise.promise;
}

function findTopPosts(subreddit, after, limit){

    var qPromise = q.defer();

    request({
        method: "GET",
        url: "https://oauth.reddit.com/r/"+subreddit+"/top",
        headers: the_headers, //the_headers is a global variable rn
        qs: {
            limit: (limit>100)?100:limit,
            after: after
        }
    }, function(error, response, body){
        if(error){
            qPromise.reject(error);
        }else{
            var parsedBody = JSON.parse(body);
            var after = parsedBody.data.after; // <-- information that I need
            qPromise.resolve(parsedBody);   //Return the promise resolution
        }
    });

    return qPromise.promise;
}


//This is confusing, reference following link
// http://stackoverflow.com/questions/40857793/how-to-make-http-requests-that-need-to-happen-in-order-and-depend-on-the-data-r/40874936#40874936
function findTopN(subreddit, limit, after, list){

    var holdingList;    //List of posts that we have so far fetched
    var myLimit;        //Limit of posts we want

    //If list is undefined, create empty list. Otherwise, use holdingList
    if(list){
        holdingList = list;
    }else{
        holdingList = []
    }

    //If caller gave us a limit of posts, use that. Else, do 150.
    if(limit){
        myLimit = limit;
    } else {
        myLimit = 150;
    }

    return findTopPosts(subreddit, after, (myLimit-holdingList.length))
        .then(function(data){

            //Push the data into our holding list
            data.data.children.map(function(item){
                holdingList.push(item);
            });

            //Debug reporting
            console.log("We have " + (holdingList.length) + " posts so far");

            //If we are under our limit, make another call
            if(holdingList.length < myLimit){
                // Pagination, step forward
                var after = data.data.after;
                //Recursive call. Send the pagination anchor, the list of all items, and the items we have left
                return findTopN(subreddit, myLimit, after, holdingList);
            } else {
                //Base case, return the list
                return holdingList;
            }
        })
        .catch(function(error){
            return error;
        })
}

module.exports = {
    auth: authenticate,
    WhoAmI: whoami,
    findTopN: findTopN
}
