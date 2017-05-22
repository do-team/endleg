var AWS = require("aws-sdk");

exports.handler = (event, context, callback) => {

   // Cognito invokes this function, thus we got all user data we need.
    var user = event.userName;
    console.log(event);

    AWS.config.update({
        region: "eu-central-1",
        endpoint: "dynamodb.eu-central-1.amazonaws.com"
    });


    var params = {
        TableName: "endleg-score",
        Item: {
            "user": user,
            "wins": 0,
            "lose":0,
            "draw":0,
            "history": null
        }
    };

    var dynamodb = new AWS.DynamoDB();
    var docClient = new AWS.DynamoDB.DocumentClient();
    docClient.put(params, function(err, data) {
        if (err) {
            console.log(err);
            console.error("Unable to add new user ", user, "! Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("New user ", user, " was successfully created.");
        }
    });
};