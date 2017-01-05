//If the credentials file is not found (bc we're not in local) use environment settings
var credentials;

try {
    console.log("trying creds");
    var creds = require('./secredentials.js');
    credentials = creds;
}catch(e){
    console.log("failed creds");
    credentials = {
        reddit: {
            user: process.env.REDDIT_USER,
            pass: process.env.REDDIT_PASS,
            username: process.env.REDDIT_USERNAME,
            password: process.env.REDDIT_PASSWORD
        },
        mLab: {
            connString: process.env.MLAB_CONNSTRING
        },
        watson: {
            url: process.env.WATSON_URL,
            password: process.env.WATSON_PASSWORD,
            username: process.env.WATSON_USERNAME
        }
    }
} finally {
    console.log("creds: ");
    console.log(credentials);
    module.exports = credentials;
}
