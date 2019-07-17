const fetchMock = require('fetch-mock');

const localVersionPath = "/_ver#s";
const remoteVersionPath = "/_ver#c$";

const obj = {
    "_ver#s": 0,
    "_ver#c$": 0,
    user: {
      fullName: "",
      firstName$: "",
      lastName$: "",
      resetNameClicked$: false
    }
};

function generateVersionOperations() {
    obj["_ver#s"] += 1;
    return [
        {op: "replace", path: localVersionPath, value: obj["_ver#s"]},
        {op: "test", path: remoteVersionPath, value: obj["_ver#c$"]}
    ];
}

function generateReplaceOperation(tree, ...paths) {
    return paths.map(path => {
        const prop = path.substring(path.lastIndexOf('/') + 1);
        return {op: "replace", path: path, value: tree[prop]}
    });
}

function setPerson(firstName, lastName) {
    if(firstName !== null) {
        obj.user.firstName$ = firstName;
    }
    if(lastName !== null) {
        obj.user.lastName$ = lastName;
    }
    obj.user.fullName = `${obj.user.firstName$} ${obj.user.lastName$}`;
}

fetchMock.mock('*', (url, req) => {
    /*
    This mock server deliberately uses hand-written patch operations to show the expected patches coming into and out from the server.
    Normally, you would use a library like JSON-Patch to consume the incoming patches and generate the outgoing patches on the server. 
    Palindrom library has an option to run as a server in NodeJS, providing you with such functionality. However, it is not presented in this demo.
    */
    if (req.headers.Accept === 'application/json-patch+json') {
        let patch = [];
        const incomingPatch = req.body ? JSON.parse(req.body) : [];
        if (incomingPatch.length) {
            if (!incomingPatch[1] || incomingPatch[1].op !== 'test') {
                throw new Error("The client does not seem to implement OT");
            }
            incomingPatch.forEach(operation => {
                if (operation.op === 'replace') {
                    if (operation.path === remoteVersionPath) {
                        obj["_ver#c$"] = operation.value;
                    }
                    else if (operation.path === '/user/firstName$') {
                        setPerson(operation.value, null);
                        patch.push(...generateReplaceOperation(obj.user, '/user/fullName'));
                    }
                    else if (operation.path === '/user/lastName$') {
                        setPerson(null, operation.value);
                        patch.push(...generateReplaceOperation(obj.user, '/user/fullName'));
                    }
                    else if (operation.path === '/user/resetNameClicked$' && (operation.value === "true" || operation.value === true)) {
                        // Polymer sends string "true", because the value is bound to a HTML attribute
                        // React sends boolean true
                        setPerson("Isaac", "Newton");
                        patch.push(...generateReplaceOperation(obj.user, '/user/resetNameClicked$', '/user/firstName$', '/user/lastName$', '/user/fullName'));
                    }
                    else {
                        console.error("Unexpected patch", operation);
                        throw new Error("Unexpected patch");
                    }
                };
            });
        }
        else if (url.endsWith('/subpage.html')) {
            setPerson("Nikola", "Tesla");
            patch.push(...generateReplaceOperation(obj.user, '/user/firstName$', '/user/lastName$', '/user/fullName'));

        }
        else {
            setPerson("Albert", "Einstein");
            patch.push(...generateReplaceOperation(obj.user, '/user/firstName$', '/user/lastName$', '/user/fullName'));
        }
        patch.unshift(...generateVersionOperations());
        return {
            status: 200,
            headers: { contentType: 'application/json-patch+json' },
            body: JSON.stringify(patch)
        };
    }

    if (url.endsWith('/subpage.html')) {
        setPerson("Nikola", "Tesla");
    }
    else {
        setPerson("Albert", "Einstein");
    }

    return {
        status: 200,
        headers: { contentType: 'application/json' },
        body: JSON.stringify(obj)
    };
});