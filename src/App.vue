<template>
    <HelloWorld v-model="obj" />
    <!-- v-model directive has special meaning in Vue. It creates 2-way data binding. See: https://vuejs.org/v2/guide/components.html#Using-v-model-on-Components -->
</template>

<script>
    // the below line is only needed to simulate the server
    // import '../mock-server/dist/mock-server.js'
    import { PalindromDOM } from 'palindrom'
    import HelloWorld from './components/HelloWorld.vue'
    import Http from 'http';

    function requestPalindromConnection(onConnect) {
        Http.get("http://localhost:8080/VuePalindromServer/NewConnection", (response) => {
            let data = "";

            // A chunk of data has been recieved.
            response.on("data", (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            response.on("end", () => {
                console.log("NewConnection: ", data);

                connectToPalindrom(data, onConnect);
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    }

    function connectToPalindrom(remoteUrl, onConnect) {
        // this is a generic Palindrom client config. See https://palindrom.github.io/docs/04-_PalindromDOM/
        new PalindromDOM({
            // "remoteUrl" is the location of the Palindrom server. By convention, the server should respond with a Palindrom
            // session JSON object when request has a header "Accept: application/json". If the Palindrom server is located in
            // another location, provide the URL here. Make sure that this URL is always the same, however every request to
            // it creates a new Palindrom session, which individual URL is given in the "X-Location" header of the response
            // to "remoteUrl"
            //remoteUrl: window.location.href,
            remoteUrl: remoteUrl,
            onStateReset: onConnect,
            debug: false,
            localVersionPath: "/_ver#c$",
            remoteVersionPath: "/_ver#s",
            ot: true,
            useWebSocket: true // with not simulated server, change this to true
        });
    }

    export default {
        name: 'app',
        components: {
            HelloWorld
        },
        methods: {
            onConnect(obj) {
                // use Palindrom's data object in the "App" component's data
                console.log("Connected to Palindrom", obj, JSON.stringify(obj));
                this.obj = obj;
            }
        },
        created() {
            // when an instance of the "App" component is created, request Palindrom connection and provide a callback
            requestPalindromConnection(this.onConnect);
        },
        data: function () {
            return {
                obj: null
            };
        }
    }
</script>
