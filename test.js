
var IronLogEntry = require('./IronLogEntry');

var factory = IronLogEntry.createFromOptions({
    type: IronLogEntry.types.info,
    detailLevel: 0
});

var x = factory.create({
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
}).addChild(new Error("grandchild")));

console.log(x.toString());

console.log(x.getJSON());
