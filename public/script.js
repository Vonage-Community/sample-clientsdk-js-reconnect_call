const VonageClient = window.NexmoClient;
const loginContainer = document.querySelector("#loginContainer");
const loginForm = document.querySelector("form");
const errorStatus = document.querySelector("#errorStatus");
const appToAppContainer = document.querySelector("#appToAppContainer");
const userToCallInput = document.getElementById("user-to-call");
const callButton = document.getElementById("call");
const hangupButton = document.getElementById("hangup");
const statusElement = document.getElementById("status");
const logs = document.getElementById("logs");

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
        let conversation = await app.getConversation(conversationId);
        callButton.addEventListener("click", event => {
            event.preventDefault();
            let number = userToCallInput.value;
            if (number !== ""){
                app.callServer(number,"app");
            } else {
                statusElement.innerText = 'Please enter username.';
            }
        });

        app.on("member:call", (member, call) => {
            hangupButton.addEventListener("click", () => {
                call.hangUp();
            });
        });

        app.on("call:status:changed",(call) => {
            statusElement.innerText = `Call status: ${call.status}`;
            // more info on call status: https://developer.nexmo.com/sdk/stitch/javascript/NXMCall.html#.CALL_STATUS
            if (call.status === call.CALL_STATUS.STARTED){
                callButton.style.display = "none";
                hangupButton.style.display = "inline";
            }
            if (call.status === call.CALL_STATUS.COMPLETED){
                callButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.UNANSWERED){
                callButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.REJECTED){
                callButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.BUSY){
                callButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.TIMEOUT){
                callButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
            if (call.status === call.CALL_STATUS.FAILED){
                callButton.style.display = "inline";
                hangupButton.style.display = "none";
            }
        });

        // To display logs
        conversation.on('log_event', (from, event) => {
            let logDetails = "";
            for (const [key, value] of Object.entries(event.body)) {
                logDetails += `${key}: ${value}<br/>`
            }
            logs.innerHTML += `
        <details>
          <summary>${event.body.timestamp}</summary>
          ${logDetails}
        </details>`
        });
    }
    catch (error){
        console.error('error in setup: ', error);
    };

};


loginForm.addEventListener("submit", async(event)=>{
    event.preventDefault();
    errorStatus.textContent = "";
    try {
        const data = await postData("/getJWT",{username:loginForm.elements.username.value});
        if (data.code !== 200){
            errorStatus.textContent = data.error;
        } else {
            // console.log('data: ',data);
            await setup (data.jwt, data.conversationId);
            loginContainer.style.display = "none";
            appToAppContainer.style.display = "block";
        }
    }
    catch(error){
        console.error('error logging in: ', error);
    }
});
