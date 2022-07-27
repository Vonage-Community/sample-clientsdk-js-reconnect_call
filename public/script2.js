const VonageClient = window.NexmoClient;
const loginContainer = document.querySelector("#loginContainer");
const loginForm = document.querySelector("form");
const errorStatus = document.querySelector("#errorStatus");
const appToAppContainer = document.querySelector("#appToAppContainer");
const answerButton = document.getElementById("answer");
const hangupButton = document.getElementById("hangup");
const statusElement = document.getElementById("status");
const usernameElement = document.getElementById("username-placeholder");
const clearLSButton = document.querySelector("#clearLS");

let canReconnect = false;
let reconnectDataObj;

// Check if reconnect data in local storage
let reconnectDataJSON = localStorage.getItem('reconnect');
if (reconnectDataJSON){
    console.log("reconnectData: ",reconnectDataJSON);
    canReconnect = true;
    // get values from local storage and parse
    reconnectDataObj = JSON.parse(reconnectDataJSON);

    // prefill username
    loginForm.elements.username.value = reconnectDataObj.username
}

async function postData(url='', data={}){
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }
    catch (error){
        console.error('Error: ', error);
    }
}

async function setup(jwt, conversationId){
    try {
        const client = new VonageClient({debug:false});
        const app = await client.createSession(jwt);

        if (canReconnect){
            console.log("reconnecting...");
            console.log(reconnectDataObj.convId, reconnectDataObj.rtcId);
            app.reconnectCall(reconnectDataObj.convId, reconnectDataObj.rtcId).then((nxmCall) => {
                console.log("reconnected nxmCall: ",nxmCall);
                answerButton.style.display = "none";
                hangupButton.style.display = "inline";
                hangupButton.addEventListener("click", () => {
                    nxmCall.hangUp();
                    // remove data from local storage
                    localStorage.removeItem('reconnect');
                });
            }).catch((error) => {
                console.error("error reconnecting: ",error);
            });
        }

        app.on("member:call", (member, call) => {
            console.log("call: ", call);
            statusElement.innerText = "Inbound app call - click to answer...";
            answerButton.disabled = false;
            answerButton.addEventListener("click", event => {
                event.preventDefault();
                call.answer();
            });
            hangupButton.addEventListener("click", () => {
                call.hangUp();
                // remove data from local storage
                localStorage.removeItem('reconnect');
                canReconnect = false;
            });
        });

        app.on("call:status:changed",(call) => {
            statusElement.innerText = `Call status: ${call.status}`;
            // more info on call status: https://developer.nexmo.com/sdk/stitch/javascript/NXMCall.html#.CALL_STATUS
            if (call.status === call.CALL_STATUS.ANSWERED){
                console.log("answered: ", call);
                answerButton.style.display = "none";
                hangupButton.style.display = "inline";
                // save data to local storage
                const reconnectData = {
                    "username": call.conversation.me.user.name,
                    "convId": call.conversation.id,
                    "rtcId": call.id
                };
                console.log("reconnectData: ", reconnectData);
                localStorage.setItem('reconnect', JSON.stringify(reconnectData));

            }
            if (call.status === call.CALL_STATUS.STARTED){
                console.log("started: ", call);
                hangupButton.addEventListener("click", () => {
                    call.hangUp();
                    // remove data from local storage
                    localStorage.removeItem('reconnect');
                });

            }
            if (call.status === call.CALL_STATUS.COMPLETED){
                answerButton.style.display = "inline";
                answerButton.disabled = true;
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.UNANSWERED){
                answerButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.REJECTED){
                answerButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.BUSY){
                answerButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.TIMEOUT){
                answerButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.FAILED){
                answerButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
        });

    }
    catch (error){
        console.error('error in setup: ', error);
    };

};


loginForm.addEventListener("submit", async(event)=>{
    event.preventDefault();
    errorStatus.textContent = "";
    if (canReconnect){
        try {
            console.log("/reconnect");
            const data = await postData("/reconnect",{username:reconnectDataObj.username});
            if (data.code !== 200){
                errorStatus.textContent = data.error;
            } else {
                console.log('/reconnect data: ',data);
                await setup (data.jwt);
                loginContainer.style.display = "none";
                appToAppContainer.style.display = "block";
                usernameElement.innerText = `${reconnectDataObj.username}`;
            }
        }
        catch(error){
            console.error('error logging in: ', error);
        }
    } else {
        try {
            const data = await postData("/getJWT2",{username:loginForm.elements.username.value});
            if (data.code !== 200){
                errorStatus.textContent = data.error;
            } else {
                // console.log('data: ',data);
                await setup (data.jwt);
                loginContainer.style.display = "none";
                appToAppContainer.style.display = "block";
                usernameElement.innerText = `${data.user.name}`;
            }
        }
        catch(error){
            console.error('error logging in: ', error);
        }
    }
});

clearLSButton.addEventListener("click", () => {
    console.log("clear local storage");
    localStorage.clear();
});
