const express = require("express");
const mongodb = require("mongodb");
const amqp = require('amqplib');
const bodyParser = require("body-parser");

if (!process.env.DBHOST) {
    throw new Error("Please specify the databse host using environment variable DBHOST.");
}

if (!process.env.DBNAME) {
    throw new Error("Please specify the name of the database using environment variable DBNAME");
}

if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

//
// Connect to the database.
//
function connectDb() {
    return mongodb.MongoClient.connect(DBHOST) 
        .then(client => {
            return client.db(DBNAME);
        });
}

//
// Connect to the RabbitMQ server.
//
function connectRabbit() {

    console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);

    return amqp.connect(RABBIT) // Connect to the RabbitMQ server.
        .then(messagingConnection => {
            console.log("Connected to RabbitMQ.");

            return messagingConnection.createChannel(); // Create a RabbitMQ messaging channel.
        });
}

//
// Setup event handlers.
//
// function setupHandlers(app, db, messageChannel) {

//     const videosCollection = db.collection("ads");



//     function consumeViewedMessage(msg) { // Handler for coming messages.
//         console.log("Received a 'viewed' message");

//         const parsedMsg = JSON.parse(msg.content.toString()); // Parse the JSON message.
        
//         return videosCollection.insertOne({ videoId: parsedMsg.video.id, watched: new Date() }) // Record the "view" in the database.
//             .then(() => {
//                 console.log("Acknowledging message was handled.");
                
//                 messageChannel.ack(msg); // If there is no error, acknowledge the message.
//             });
//     };

//     return messageChannel.assertExchange("viewed", "fanout") // Assert that we have a "viewed" exchange.
//         .then(() => {
//             return messageChannel.assertQueue("", {}); // Create an anonyous queue.
//         })
//         .then(response => {
//             const queueName = response.queue;
//             console.log(`Created queue ${queueName}, binding it to "viewed" exchange.`);
//             return messageChannel.bindQueue(queueName, "viewed", "") // Bind the queue to the exchange.
//                 .then(() => {
//                     return messageChannel.consume(queueName, consumeViewedMessage); // Start receiving messages from the anonymous queue.
//                 });
//         });
// }

//
// Start the HTTP server.
//
function startHttpServer(db, messageChannel) {
    return new Promise(resolve => { // Wrap in a promise so we can be notified when the server has started.
        const app = express();
        app.use(bodyParser.json()); // Enable JSON body for HTTP requests.
        // setupHandlers(app, db, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve(); // HTTP server is listening, resolve the promise.
        });
    });
}

//
// Application entry point.
//
function main() {
    return connectDb()                                          // Connect to the database...
        .then(db => {                                           // then...
            return connectRabbit()                              // connect to RabbitMQ...
                .then(messageChannel => {                       // then...
                    return startHttpServer(db, messageChannel); // start the HTTP server.
                });
        });
}

const ads = {
    "1": {
        "name":"google",
        "url":"https:www.google.com"
    },
    "2": {
        "name" :"lazada",
        "url": "https:www.lazada.co.th"
    },
    "3": {
        "name" :"American airlines",
        "url": "https:www.aa.com"
    },
    "4": {
        "name" :"Kasetsart University",
        "url": "https:www.ku.ac.th"
    },
    "5": {
        "name" :"Y8",
        "url": "https:www.y8.com"
    },
    
}

let x = Math.floor((Math.random() * 5) + 1);

main()
    .then(() => console.log("Microservice online."))
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });