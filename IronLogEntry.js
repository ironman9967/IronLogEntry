
function IronLogEntry(type, message, detailLevel, data, child) {
	if ((this instanceof IronLogEntry) === false) {
		return new IronLogEntry(type, message, data, child);
	}

    if (data !== void 0 && (data instanceof Error || data instanceof IronLogEntry)) {
        child = data;
    }
    else if (data !== void 0) {
        this.data = data;
    }
    else {
        this.data = {};
    }
    if (detailLevel !== void 0 && (detailLevel instanceof Error || detailLevel instanceof IronLogEntry)) {
        child = detailLevel;
    }
    else if (typeof detailLevel === "number") {
        this.detailLevel = detailLevel;
    }
    if (typeof child === "object" && !(child instanceof Error || child instanceof IronLogEntry)) {
        this.child = new IronLogEntry(child.type, child.message, child.detailLevel, child.data, child.child);
    }
    else if (child !== void 0) {
        this.child = new IronLogEntry(child);
    }

	if (type instanceof Error || type instanceof IronLogEntry) {
		this.message = type.message;
		if (type instanceof IronLogEntry) {
			this.type = type.type;
			this.data = type.data;
			this.child = type.child;
			this.stack = type.stack;
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
		this.message = message;
        this.stack = new Error().stack.replace(/.*\n.*at new IronLogEntry \(.*\)\n/g, "").replace(/.*at/g, "at");
	}
	if (this.type !== void 0 && this.type.toLowerCase().indexOf('error') >= 0 && this.detailLevel === void 0) {
		this.detailLevel = 0;
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
		linePrefix + "Detail Level: " + this.detailLevel + "\n" +
		linePrefix + "Stack: " + ("\n" + this.stack).replace(/\n/g, "\n\t" + linePrefix) + "\n" +
		linePrefix + "Data: " + JSON.stringify(this.data) + "\n" +
        (this.child !== void 0
			? linePrefix + "Child: \n" +this.child.toString(nest + 1)
			: ""
		);
};

IronLogEntry.prototype.getJSON = function () {
    return JSON.stringify(this);
};

IronLogEntry.fromJSON = function (json) {
    var obj = JSON.parse(json);
	return new IronLogEntry(obj.type, obj.message, obj.detailLevel, obj.data, obj.child);
};

module.exports = IronLogEntry;
