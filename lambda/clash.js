var AWS = require("aws-sdk");
// test
exports.handler = function(event, context) {
    // Update of AWS config to reach DynamoDB
    AWS.config.update({
        region: "eu-central-1",
        endpoint: "dynamodb.eu-central-1.amazonaws.com"
    });
    var docClient = new AWS.DynamoDB.DocumentClient();
    // Parsing incoming object from SNS, result is incoming array with two users and their cards.
    var incoming = JSON.parse(event.Records[0].Sns.Message);
    console.log('Player one >>> ', incoming[0].user, ' <<<   VS   Player two >>> ', incoming[1].user + ' <<< ');
    // Definitions of winning conditions
    var combinations = {
        rock: {
            name: "rock",
            defeats: ["scissors", "lizard"]
        },
        paper: {
            name: "paper",
            defeats: ["rock", "spock"]
        },
        scissors: {
            name: "scissors",
            defeats: ["paper", "lizard"]
        },
        lizard: {
            name: "lizard",
            defeats: ["paper", "spock"]
        },
        spock: {
            name: "spock",
            defeats: ["scissors", "rock"]
        }
    };

    for (i = 0; i < 2; i++) {
        incoming[i].winScore = 0;
        incoming[i].loseScore = 0;
        incoming[i].drawScore = 0;
        incoming[i].wins = 0;
        incoming[i].lose = 0;
        incoming[i].draw = 0;
    }

    // Main loop to cycle all cards, to find a winner and to prepare parameters for DB Update.
    main = function(callback) {
        for (battle = 1; battle < 6; battle++) {
            card = ["card" + battle];
            console.log(incoming[0][card], incoming[1][card]);
            if (incoming[0][card] === incoming[1][card]) {
                console.log("Draw! Round: ", battle);
                incoming[0].drawScore++;
                incoming[1].drawScore++;
            } else {
                var leadCard = combinations[incoming[0][card]];
                var victory = leadCard.defeats.indexOf(incoming[1][card]) > -1;
                //Display result
                if (victory) {
                    console.log("Player ", incoming[0].user, " defeats ", incoming[1].user, " (", incoming[0][card], " beats ", incoming[1][card], ").");
                    incoming[0].winScore++;
                    incoming[1].loseScore++;
                } else {
                    console.log("Player ", incoming[1].user, " defeats ", incoming[0].user, " (", incoming[1][card], " beats ", incoming[0][card], ").");
                    incoming[0].loseScore++;
                    incoming[1].winScore++;
                }
            }
        }
        // Evaluation of who is real overall winner (could be shortened).
        if (incoming[0].winScore > incoming[1].winScore) {
            incoming[0].wins = 1;
            incoming[1].lose = 1;
        }
        if (incoming[0].winScore < incoming[1].winScore) {
            incoming[1].wins = 1;
            incoming[0].lose = 1;
        }
        if (incoming[0].winScore === incoming[1].winScore){
            console.log('P1 score:', incoming[0].winScore);
            console.log('P2 score:', incoming[1].winScore);
            incoming[1].draw = 1;
            incoming[0].draw = 1;
        }
        var winMessage = "Draw";
        if (incoming[0].wins = 1) { winMessage = "Winner is: " + incoming[0].user};
        if (incoming[1].wins = 1) { winMessage = "Winner is: " + incoming[1].user};

        console.log(winMessage);

        for (i = 0; i <= 1; i++) {
            var battleHistory =    {
                                  "Player1":
                                    {
                                      "name": incoming[0].user,
                                      "card1": incoming[0].card1,
                                      "card2": incoming[0].card2,
                                      "card3": incoming[0].card3,
                                      "card4": incoming[0].card4,
                                      "card5": incoming[0].card5
                                    }
                                  ,
                                  "Player2":
                                    {
                                      "name": incoming[1].user,
                                      "card1": incoming[1].card1,
                                      "card2": incoming[1].card2,
                                      "card3": incoming[1].card3,
                                      "card4": incoming[1].card4,
                                      "card5": incoming[1].card5
                                    }
                                 };


                // console.log(battleHistory);
                // console.log(JSON.stringify(battleHistory));
             // incoming[0].user + " sent " + incoming[0].card1 + ", " + incoming[0].card2 + ", " + incoming[0].card3 + ", " + incoming[0].card4 + ", " + incoming[0].card5 + " while his opponent " + incoming[1].user + " sent " + incoming[1].card1 + ", " + incoming[1].card2 + ", " + incoming[1].card3 + ", " + incoming[1].card4 + ", " + incoming[1].card5 + ".";

            var paramsScore = {
                TableName:'endleg-score',
                Key:{
                    "user": incoming[i].user
                },
                UpdateExpression: "SET wins = wins + :w, lose = lose + :l, draw = draw + :d, history = :h",
                ExpressionAttributeValues:{
                    ":w":incoming[i].wins,
                    ":l":incoming[i].lose,
                    ":d":incoming[i].draw,
                    ":h":battleHistory
                },
                ReturnValues:"NONE"
            };

            console.log(paramsScore);

            var paramsMain = {
                TableName: 'endleg-main',
                Key:{
                    "user": incoming[i].user
                },
                UpdateExpression: "set fightflag = :flag",
                ExpressionAttributeValues:{
                    ":flag":0
                },
                ReturnValues:"UPDATED_NEW"
            };

            docClient.update(paramsScore, function(err, data) {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                }
            });

            docClient.update(paramsMain, function(err, data) {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                }
            });
        }
    }

    main();
};