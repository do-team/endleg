var AWS = require("aws-sdk");
var nJwt = require('njwt');
exports.handler = (event, context, callback) => {
    AWS.config.update({
        region: "eu-central-1",
        endpoint: "dynamodb.eu-central-1.amazonaws.com"
    });
    var token = event.headers.sectoken;
    // Sent cards are now mapped from incoming JSON string
    var cards = (JSON.parse(event.body));
    var signingKey = 'secret';
    console.log('token: ', token);

    nJwt.verify(token, signingKey, function(err, verifiedJwt) {
            console.log(event);

            if (err) {

                console.log('Error - but actually it will go trough...', err); // Token has expired, has been tampered with, etc
                //Extracted username from the hash.
                var user = err.parsedBody['cognito:username'];

                // Card validation goes here - to check, if user is not sending cards out of allowed range.
                var validCards = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
                console.log('Allowed cards: ', validCards);
                var sentCards = [cards.card1, cards.card2, cards.card3, cards.card4, cards.card5];
                console.log('Cards sent: ', sentCards);

                var valid = true;
                for (var i = 0; i < sentCards.length; i++) {
                   found = false;
                    if (validCards.indexOf(sentCards[i]) > -1) {
                        found = true;
                        break;
                    }
                   if (!found) {
                    valid = false;
                   }
                }
                if (valid === false) {
                    console.log('Invalid card found! Returning with error.');
                    var err = 'Invalid card found!';
                    callback(err);
                    }
                console.log('Alles gute!');

                    //Cards validated...
                    var params = {
                        TableName: "endleg-main",
                        Item: {
                            "user": user,
                            "name": event.body.name,
                            "card1": cards.card1,
                            "card2": cards.card2,
                            "card3": cards.card3,
                            "card4": cards.card4,
                            "card5": cards.card5,
                            "fightflag": 1
                        }
                    };
                    var dynamodb = new AWS.DynamoDB();
                    var docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.put(params, function(err, data) {
                        if (err) {
                            console.log(err);
                            console.error("Unable to add new items from user ", user, ". Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Request by user", user, " was successfully added.");
                        }
                    });


            } else {
                console.log('All OK decrypted. That also means, it will do nothing with Dynamo :).');
                console.log(verifiedJwt); // Will contain the header and body
        }
    });
};