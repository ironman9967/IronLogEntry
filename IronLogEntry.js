
function IronLogEntry(type, message, detailLevel, data, child) {
	if ((this instanceof IronLogEntry) === false) {
		return new IronLogEntry(type, message, data, child);
	}

    this.message = message;
    this.data = data === void 0 ? {} : data;
    this.child = child === void 0 ? void 0 : new IronLogEntry(child);
    this.detailLevel = detailLevel;

    if (type instanceof Error || type instanceof IronLogEntry) {
        if (type instanceof IronLogEntry) {
            this.type = type;
            this.data = type.data;
            this.child = type.child;
        }
        else {
            this.type = type.name;
            this.stack = type.stack.substring(type.stack.indexOf('\n') + 1).replace(/    at /g, "at ");
            if (type.arguments !== void 0) {
                this.data.arguments = type.arguments;
            }
        }
        if (message instanceof IronLogEntry) {
            this.child = message;
        }
        else if (message instanceof Error) {
            this.child = new IronLogEntry(message);
        }
        else if (typeof message === "object") {
            this.data = message
        }
    }
    else {
        this.type = type;
    }
    if (this.type !== void 0 && this.type.toLowerCase().indexOf('error') > 0 && this.detailLevel === void 0) {
        this.detailLevel = Number.MAX_VALUE;
    }
}

IronLogEntry.prototype.toString = function (nest) {
    if (nest === void 0) {
        nest = 0;
    }
    var linePrefix = "";
    for (var i = 0; i < nest; i++) {
        linePrefix += "\t";
    }
    return linePrefix + this.type + ": " + this.message + "\n" +
        linePrefix + "Stack: " + ("\n" + this.stack).replace(/\n/g, "\n\t" + linePrefix) + "\n" +
        linePrefix + "Data: " + JSON.stringify(this.data) + "\n" +
        linePrefix + "Child: \n" + (
            this.child !== void 0
                ? this.child.toString(nest + 1)
                : linePrefix + "\tundefined"
        );
};

IronLogEntry.prototype.fromJSON = function (json) {
    var obj = JSON.parse(json);
    this.type = obj.type;
    this.message = obj.message;
    if (obj.stack !== void 0) {
        this.stack = obj.stack;
    }
    this.data = obj.data;
    this.child = obj.child;
    return this;
};

module.exports = IronLogEntry;
