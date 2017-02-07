# Project Endleg
Demoproject for utilizing as many of managed AWS services as possible - all in secure and prod-like manner.

This is main organization repository. Here we should store documentation and also sourcode of infrastructure.

IAM roles and policies  
Cloudformation templates  
API Gateway source code  
DynamoDB schemas  
Cognito setup  

Plus we use [GitHub Projects](https://github.com/do-team/endleg/projects/1) to maintain flow of main tasks for our team.

Concept:
========

Endleg is slightly advanced version of `rock-paper-scissors` game. Players will enter their "army" of 5 cards and submit them to fight.
On serverside, once a day (or hourly) batchprocessing is scheduled. First it will create pairs of players, then it calculate, which player wins.
Score is set and users are notified.

All functionality is represented by microservices, small NodeJS scripts runing on Lambda. Each component has it's own repository.

Main components are:
--------------------

[Order entry](https://github.com/do-team/endleg-in) - this processes user's card order and saves them into DynamoDB. Sets a flag to "ready".  
[Scheduled batch](https://github.com/do-team/endleg-batch) - create pairs of users (set a flag "fight" for half of users). Flagging in DynamoDB will trigger next function.  
[Fight processing](https://github.com/do-team/endleg-clash) - direct comparison of two players (take one "fight" flag and one "ready" flag, then set flag to "wait"). Saves result to score table.  
[Score](https://github.com/do-team/endleg-out) - output of current score history of user.  
[Frontend](https://github.com/do-team/endleg-frontend) - written in Express / Angular.  

DynamoDB tables:
----------------

Users (via Cognito)  
Score / Statistic  

TEST CHANGE
