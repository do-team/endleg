var AWS = require("aws-sdk");
var nJwt = require('njwt');

exports.handler = (event, context, callback) => {
    AWS.config.update({
        region: "eu-central-1",
        endpoint: "dynamodb.eu-central-1.amazonaws.com"
    });
    var token = event.headers.sectoken;
    var signingKey = 'secret';
    console.log('token: ', token);

    nJwt.verify(token, signingKey, function(err, verifiedJwt) {
            if (err) {

                console.log('Error - but actually it will go trough...', err); // Token has expired, has been tampered with, etc
                var docClient = new AWS.DynamoDB.DocumentClient();
                var user = err.parsedBody['cognito:username'];
                var table = "endleg-score";
                var params = {
                     TableName:table,
                     Key:{
                         "user": user
                     }
                 };

                console.log("Reading score from the table...");
                docClient.get(params, function(err, data) {
                    if (err) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 1));
                    } else {
                        var response = JSON.stringify(data, null, 1);
                        console.log("GetItem succeeded:", response);
                        callback(response);
                    }
                });
            } else {
                console.log('All OK decrypted. That also means, it will do nothing with Dynamo :).');
                console.log(verifiedJwt); // Will contain the header and body
        }
    });
};