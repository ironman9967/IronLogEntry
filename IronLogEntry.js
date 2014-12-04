
var _ = require('lodash');
var uuid = require('uuid');

function processOptions(opts) {
	if (opts === void 0) {
		opts = {};
	}
	return {
		type: opts.type === void 0 ? IronLogEntry.types.error : opts.type,
		detailLevel: opts.detailLevel === void 0 ? 0 : opts.detailLevel,
		data: {},
		message: "",
		types: opts.types === void 0 ? IronLogEntry.types : opts.types,
		createdFromOpts: false,
		trimFromStack: opts.trimFromStack === void 0 ? [] : opts.trimFromStack
	};
}

function setProp(prop, entry, opts, instance) {
	instance[prop] = entry[prop] !== void 0 ? entry[prop] : opts[prop];
}

function IronLogEntry(entry, opts) {
	if ((this instanceof IronLogEntry) === false) {
		return new IronLogEntry(entry, opts);
	}

	this.id = entry.id === void 0 ? uuid.v4() : entry.id;
	this.timestamp = entry.timestamp === void 0 ? new Date().getTime() : entry.timestamp;

	this.opts = processOptions(opts);

	if (entry instanceof Error) {
		this.message = entry.message;
		this.type = {
			type: entry.name,
			addStack: true
		};
		this.stack = entry.stack.substring(entry.stack.indexOf('\n') + 1).replace(/    at /g, "at ");
		if (entry.arguments !== void 0) {
			this.data.arguments = entry.arguments;
		}
		else {
			this.data = {};
		}
		setProp('detailLevel', {}, this.opts, this);
	}
	else {
		var instance = this;
		_.each(_.keys(this.opts), function (key) {
			if (!_.contains([ 'types' ], key)) {
				setProp(key, entry, instance.opts, instance);
			}
		});
		this.userSuppliedKeys = [];
		_.each(_.difference(_.keys(entry), _.keys(this.opts)), function (key) {
			if (!_.contains([ 'id', 'timestamp', 'opts', 'stack', 'child', 'line', 'userSuppliedKeys' ], key)) {
				instance.userSuppliedKeys.push(key);
				setProp(key, entry, instance.opts, instance);
			}
		});

		var stack = new Error().stack
			.replace(/.*Error.*\n/, "")
			.replace(/.*at Object.log \(.*IronLogEntry.*\)\n/g, "")
			.replace(/.*at new IronLogEntry \(.*\)\n/g, "")
			.replace(/.*at IronLogEntry.addChild \(.*\)\n/g, "")
			.replace(/.*at /g, "at ");

		_.each(this.opts.trimFromStack, function (trimRegex) {
			stack = stack.replace(new RegExp(trimRegex, 'g'), "");
		});

		if (this.type !== void 0 && this.type.addStack !== void 0 && this.type.addStack)  {
			this.stack = stack;
		}

		this.line = stack;
		this.line = this.line.substring(3, this.line.indexOf('\n'));
		if (this.line.indexOf('(') > -1) {
			this.line = this.line.substring(this.line.indexOf('(') + 1, this.line.indexOf(')'));
		}
	}
}

IronLogEntry.prototype.addChild = function (child) {
	this.child = new IronLogEntry(child, this.opts);
	if (child.child !== void 0) {
		this.child.addChild(child.child, this.opts);
	}
	return this;
};

IronLogEntry.prototype.toString = function (nest) {
	if (nest === void 0) {
		nest = 0;
	}
	var linePrefix = "";
	for (var i = 0; i < nest; i++) {
		linePrefix += "\t";
	}
	var type = typeof this.type === "object" ? this.type.type : this.type;
	var str = linePrefix + type + "(" + this.id + "): " + this.message + "\n" +
		linePrefix + "at: (" + this.line + ")\n" +
		linePrefix + "Timestamp: " + new Date(this.timestamp) + "\n" +
		linePrefix + "Detail Level: " + this.detailLevel + "\n" +
		(this.stack !== void 0 ? linePrefix + "Stack: " + ("\n" + this.stack).replace(/\n/g, "\n\t" + linePrefix) + "\n" : "") +
		linePrefix + "Data: " + JSON.stringify(this.data) + "\n";
	var instance = this;
	_.each(this.userSuppliedKeys, function (key) {
		var objStr = typeof instance[key] === "object"
			? JSON.stringify(instance[key])
			: instance[key].toString();
		str += linePrefix + key + ": " + objStr + "\n";
	});
	str += (this.child !== void 0
		? linePrefix + "Child: \n" + this.child.toString(nest + 1)
		: "");
	return str.trim();
};

IronLogEntry.prototype.getJSON = function () {
    return JSON.stringify(getCleanObject(this), null, '\t');
};

function getCleanObject(ironLogEntry) {
	var t = _.cloneDeep(ironLogEntry);
	t.type = typeof ironLogEntry.type === "object" ? ironLogEntry.type.type : ironLogEntry.type;
	t.opts = void 0;
	t.userSuppliedKeys = void 0;
	t.trimFromStack = void 0;
	t.createdFromOpts = void 0;
	if (t.child !== void 0) {
		t.child = getCleanObject(t.child);
	}
	return t;
}

IronLogEntry.fromJSON = function (json, opts) {
	var obj = JSON.parse(json);
	var entry = new IronLogEntry(obj, opts);
	if (obj.child !== void 0) {
		entry.child = IronLogEntry.fromJSON(JSON.stringify(obj.child), opts);
	}
	return entry;
};

IronLogEntry.types = {
	info: {
		type: 'Info'
	},
	warn: {
		type: 'Warn'
	},
	error: {
		type: 'Error',
		addStack: true
	}
};

IronLogEntry.createFromOptions = function (opts) {
	return {
		log: function (entry) {
			var addToOpts = {
				createdFromOpts: true
			};
			return new IronLogEntry(entry, _.extend(addToOpts, opts));
		},
		opts: opts
	}
};

module.exports = IronLogEntry;
