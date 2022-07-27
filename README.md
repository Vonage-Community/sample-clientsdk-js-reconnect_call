# Reconnect a Call with Vonage JS Client SDK

## Description

This repository contains a demo application to showcase the ability to reconnect to a call if a browser's tab/window is accidentally closed or refresh. More info can be found in the Vonage Developer Documentation [guide](https://developer.vonage.com/client-sdk/in-app-voice/guides/reconnect-call-js/javascript).
The application is based on the Making an App to App Voice Call [tutorial](https://developer.vonage.com/client-sdk/tutorials/app-to-app/introduction/javascript).

## How it works
The `index.html` will send the call request. It has a link to the receiving page `index2.html`. You will need to "log in" to both pages to generate the JWTs created by the `server.js`.

Copy the username from the receiving page into the sending page and make the call.

Answer the call in the receiving page. This will save the `username`, `conversationId`, and `rtcId` into the browser's local storage.

While on the call, refresh the receiving page's tab. It should load with the username already in the form input. When you re-login, another JWT is generated from the username and with the `conversationId` and `rtcId` from local storage, you will be reconnected to the call.

>Note: Once you refresh the page, you have a 20-second time limit to be able to reconnect successfully.