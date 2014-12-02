
var IronLogEntry = require('./IronLogEntry');

var factory = IronLogEntry.createFromOptions({
    type: IronLogEntry.types.info,
    detailLevel: 0,
    trimFromStack: [
        '.*at createError \\(.*\\)\\n'
    ]
});

var x = createError();

console.log(factory.opts);

console.log(x.toString());

console.log(x.getJSON());

function createError() {
    return factory.create({
        type: IronLogEntry.types.error,
        message: "test message",
        userInfo: {
            some: "user data or object"
        }
    }).addChild(factory.create({
        message: "child",
        type: {
            type: 'Error',
            addStack: true
        }
    }).addChild(new Error("grandchild")))
}
