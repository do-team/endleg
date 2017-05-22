var AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {

AWS.config.update({
  region: "eu-central-1",
//  endpoint: "dynamodb.eu-central-1.amazonaws.com" // This was in conflict with SNS endpoint!
});

var docClient = new AWS.DynamoDB.DocumentClient();

var table = "endleg-main";
var column = "fightflag";
var flag = 1;

// Read all ready-to-fight users

var params = {
    TableName: table,                       /* The DynamoDB table to connect to */
    //ProjectionExpression: column,           /* The column(s) we want to be returned - in case you want ONLY some columns - we want them all, full object! */
    FilterExpression: "fightflag = :flag",    /* Search term; in this case return rows whose Ansi column value equals 'fightflag' */
    ExpressionAttributeValues: {
         ":flag": flag                     /* Search value 'flag' substituted into the search term where :vlajka is found */
    }
};


console.log("Scanning main table.");


docClient.scan(params, onScan);



function onScan(err, data) {
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {

        var randomArray = shuffle(data.Items);
        //

        //console.log(randomArray);
        console.log("Scan succeeded.");
        // tohle pujde do kinesis
        var odd = false;
        var tupple = [];

        randomArray.forEach(function(data) {
            tupple.push(data)
            if (odd === true) {
            console.log(tupple); // This will be sent to SNS.
            var sns = new AWS.SNS();
            var message = JSON.stringify(tupple, null, 2);
            var params = {
                    Message: message,
                    Subject: "Clash of Legends!",
                    TopicArn: "arn:aws:sns:eu-central-1:322653911670:EndLegClash" // Will be replaced by ENV VAR
                };
            sns.publish(params, function (err, data){
                if(err) { console.log('ERROR PUBLISHING SNS: ', err);}
                else {console.log('Message published to SNS topic...');
                }
            });
            tupple = [];
           }
           odd = !odd;

        });

        // continue scanning if we have more users, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

};