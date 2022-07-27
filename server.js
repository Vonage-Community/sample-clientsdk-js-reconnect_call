const express = require("express");
const app = express();
const Nexmo = require('nexmo');
const vonage = new Nexmo({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    applicationId: process.env.APP_ID,
    privateKey: __dirname + process.env.PRIVATE_KEY
}, {debug: false});

app.use(express.json());

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.use(express.static('node_modules/nexmo-client/dist'));

async function createUser(display_name){
    console.log('display_name: ',display_name);
    const name = `${display_name}-${Date.now()}`;
    console.log('name: ',name);
    return new Promise( (resolve, reject)=>{
        vonage.users.create({ name, display_name}, (error,result)=>{
            if(error){
                console.error('error creating user', error);
                reject({error});
            } else {
                console.log('created user: ', result);
                resolve({...result, name});
            }
        });
    });
};

async function createConversation(){
    console.log('createConversation');
    return new Promise( (resolve, reject)=>{
        vonage.conversations.create({ "name": `logs-${Date.now()}`, "display_name": `Event Logs`}, (error,result)=>{
            if(error){
                console.error('error creating conversation', error);
                reject({error});
            } else {
                console.log('created conversation: ', result);
                resolve(result);
            }
        });
    });
};

async function createMember(userId){
    console.log('createMember');
    return new Promise( (resolve, reject)=>{
        vonage.conversations.members.create(process.env.LOGS_ID, {"action":"join", "user_id":userId, "channel":{"type":"app"}}, (error,result)=>{
            if(error){
                console.error('error creating member', error);
                reject({error});
            } else {
                console.log('created member: ', result);
                resolve(result);
            }
        });
    });
};

async function generateJWT(sub){
    console.log('generate JWT');
    return new Promise((resolve, reject)=>{
        const jwt = vonage.generateJwt({
            application_id: process.env.APP_ID,
            sub: sub,
            exp: Math.round(new Date().getTime()/1000)+86400,
            acl: {
                "paths": {
                    "/*/users/**":{},
                    "/*/conversations/**":{},
                    "/*/sessions/**":{},
                    "/*/devices/**":{},
                    "/*/image/**":{},
                    "/*/media/**":{},
                    "/*/applications/**":{},
                    "/*/push/**":{},
                    "/*/knocking/**":{},
                    "/*/legs/**":{}
                }
            }
        });
        console.log('jwt: ',jwt);
        resolve(jwt);
    });
};

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
    response.sendFile(__dirname + "/views/index.html");
});

app.get("/receive", (request, response) => {
    response.sendFile(__dirname + "/views/index2.html");
});

app.post("/getJWT", async(request, response) => {
    console.log('/getJWT: ', request.body.username);
    try {
        //create user
        const user = await createUser(request.body.username);
        //create conversation to track the events
        const conversation = await createConversation();
        process.env.LOGS_ID = conversation.id
        //add user as a member to conversation to be able to list the events
        const member = await createMember(user.id);
        //create a JWT and return it
        console.log('user created: ', user);
        const jwt = await generateJWT(user.name);
        response.status(200).send({code:200, jwt, user, member, conversationId:process.env.LOGS_ID});
    } catch (error){
        response.status(500).send({code:500, error});
    }
});

app.post("/getJWT2", async(request, response) => {
    console.log('/getJWT2: ', request.body.username);
    try {
        //create user
        const user = await createUser(request.body.username);
        //create a JWT and return it
        console.log('user created: ', user);
        const jwt = await generateJWT(user.name);
        response.status(200).send({code:200, jwt, user});
    } catch (error){
        response.status(500).send({code:500, error});
    }
});

app.post("/reconnect", async(request, response) => {
    console.log('/reconnect: ', request.body.username);
    try {
        //create a JWT and return it
        console.log('user created: ', request.body.username);
        const jwt = await generateJWT(request.body.username);
        response.status(200).send({code:200, jwt});
    } catch (error){
        response.status(500).send({code:500, error});
    }
});

app.get("/webhooks/answer", async (request, response) => {
    console.log('webhooks/answer request: ', request.query.to);
    const ncco = [
        {
            "action": "talk",
            "text": `Please wait while we connect you to ${request.query.to}.`
        },
        {
            "action": "connect",
            "endpoint": [
                {
                    "type": "app",
                    "user": request.query.to
                }
            ]
        }
    ];
    response.json(ncco);
});

app.post("/webhooks/event", async (request, response) => {
    console.log('webhooks/event request: ', request.body);
    vonage.conversations.events.create(process.env.LOGS_ID,{
        "type": "custom:log_event",
        "from": "SYSTEM",
        "body":request.body
    },(error, result) =>{
        if (error){
            console.error("Error sending log event: ", error);
        } else {
            console.log("Log event sent: ", result);
        }
    });
});

// listen for requests
const listener = app.listen(process.env.PORT, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
