const path = require("path");
const Nightmare = require("nightmare");
const { createSession } = require("../../dist/index.node.js");

const TEXT = "Hi there!\nThis is some test text.\n\të ";

const sandboxURL = `file://${path.resolve(__dirname, "./sandbox.html")}`;

const nightmare = Nightmare({
    executionTimeout: 15000,
    loadTimeout: 5000,
    show: true
    // webPreferences: {
    //     preload: path.resolve(__dirname, "../../web/index.js")
    // }
});

describe("environment consistency", function() {
    beforeEach(async function() {
        await nightmare.goto(sandboxURL);
        await nightmare.wait(1000);
        await nightmare.inject("js", path.resolve(__dirname, "../../web/index.js"));
        await nightmare.wait(1000);
    });

    after(async function() {
        await nightmare.end();
    });

    describe("from node to web", function() {
        it("decrypts AES-CBC from node", async function() {
            const encrypted = await createSession()
                .use("cbc")
                .encrypt(TEXT, "sample-pass");
            const result = await nightmare.evaluate(function(encrypted, done) {
                const { createSession } = window.iocane;
                createSession()
                    .decrypt(encrypted, "sample-pass")
                    .then(output => done(null, output))
                    .catch(done);
            }, encrypted);
            expect(result).to.equal(TEXT);
        });

        it("decrypts AES-GCM from node", async function() {
            const encrypted = await createSession()
                .use("gcm")
                .encrypt(TEXT, "sample-pass");
            const result = await nightmare.evaluate(function(encrypted, done) {
                const { createSession } = window.iocane;
                createSession()
                    .decrypt(encrypted, "sample-pass")
                    .then(output => done(null, output))
                    .catch(done);
            }, encrypted);
            expect(result).to.equal(TEXT);
        });
    });
});
