(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mostProxy = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

var most_1 = (typeof window !== "undefined" ? window['most'] : typeof global !== "undefined" ? global['most'] : null);
var defaultScheduler = require('most/lib/scheduler/defaultScheduler');
/**
 * Create a proxy stream and a function to attach to a yet to exist stream
 * @example
 * import {proxy} from 'most-proxy'
 * const {attach, stream} = proxy()
 *
 * stream.map(f)
 *
 * attach(otherStream)
 */
function proxy() {
    var source = new ProxySource();
    var stream = new most_1.Stream(source);
    function attach(origin) {
        source.add(origin.source);
        return origin;
    }
    return { attach: attach, stream: stream };
}
exports.proxy = proxy;
var ProxySource = function () {
    function ProxySource() {
        this.sink = void 0;
        this.active = false;
        this.source = void 0;
        this.disposable = void 0;
    }
    ProxySource.prototype.run = function (sink, scheduler) {
        this.sink = sink;
        this.active = true;
        if (this.source !== void 0) {
            this.disposable = this.source.run(sink, scheduler);
        }
        return this;
    };
    ProxySource.prototype.dispose = function () {
        this.active = false;
        this.disposable.dispose();
    };
    ProxySource.prototype.add = function (source) {
        if (this.active) {
            this.source = source;
            this.disposable = source.run(this.sink, defaultScheduler);
        } else if (!this.source) {
            this.source = source;
            return;
        } else {
            throw new Error('Can only imitate one stream');
        }
    };
    ProxySource.prototype.event = function (t, x) {
        if (this.sink === void 0) {
            return;
        }
        this.ensureActive();
        this.sink.event(t, x);
    };
    ProxySource.prototype.end = function (t, x) {
        this.propagateAndDisable(this.sink.end, t, x);
    };
    ProxySource.prototype.error = function (t, e) {
        this.propagateAndDisable(this.sink.error, t, e);
    };
    ProxySource.prototype.propagateAndDisable = function (method, t, x) {
        if (this.sink === void 0) {
            return;
        }
        this.ensureActive();
        this.active = false;
        var sink = this.sink;
        this.sink = void 0;
        method.call(sink, t, x);
    };
    ProxySource.prototype.ensureActive = function () {
        if (!this.active) {
            throw new Error('stream ended');
        }
    };
    return ProxySource;
}();


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"most/lib/scheduler/defaultScheduler":7}],2:[function(require,module,exports){
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('@most/prelude', ['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.mostPrelude = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  /** @license MIT License (c) copyright 2010-2016 original author or authors */

  // Non-mutating array operations

  // cons :: a -> [a] -> [a]
  // a with x prepended
  function cons(x, a) {
    var l = a.length;
    var b = new Array(l + 1);
    b[0] = x;
    for (var i = 0; i < l; ++i) {
      b[i + 1] = a[i];
    }
    return b;
  }

  // append :: a -> [a] -> [a]
  // a with x appended
  function append(x, a) {
    var l = a.length;
    var b = new Array(l + 1);
    for (var i = 0; i < l; ++i) {
      b[i] = a[i];
    }

    b[l] = x;
    return b;
  }

  // drop :: Int -> [a] -> [a]
  // drop first n elements
  function drop(n, a) {
    // eslint-disable-line complexity
    if (n < 0) {
      throw new TypeError('n must be >= 0');
    }

    var l = a.length;
    if (n === 0 || l === 0) {
      return a;
    }

    if (n >= l) {
      return [];
    }

    return unsafeDrop(n, a, l - n);
  }

  // unsafeDrop :: Int -> [a] -> Int -> [a]
  // Internal helper for drop
  function unsafeDrop(n, a, l) {
    var b = new Array(l);
    for (var i = 0; i < l; ++i) {
      b[i] = a[n + i];
    }
    return b;
  }

  // tail :: [a] -> [a]
  // drop head element
  function tail(a) {
    return drop(1, a);
  }

  // copy :: [a] -> [a]
  // duplicate a (shallow duplication)
  function copy(a) {
    var l = a.length;
    var b = new Array(l);
    for (var i = 0; i < l; ++i) {
      b[i] = a[i];
    }
    return b;
  }

  // map :: (a -> b) -> [a] -> [b]
  // transform each element with f
  function map(f, a) {
    var l = a.length;
    var b = new Array(l);
    for (var i = 0; i < l; ++i) {
      b[i] = f(a[i]);
    }
    return b;
  }

  // reduce :: (a -> b -> a) -> a -> [b] -> a
  // accumulate via left-fold
  function reduce(f, z, a) {
    var r = z;
    for (var i = 0, l = a.length; i < l; ++i) {
      r = f(r, a[i], i);
    }
    return r;
  }

  // replace :: a -> Int -> [a]
  // replace element at index
  function replace(x, i, a) {
    // eslint-disable-line complexity
    if (i < 0) {
      throw new TypeError('i must be >= 0');
    }

    var l = a.length;
    var b = new Array(l);
    for (var j = 0; j < l; ++j) {
      b[j] = i === j ? x : a[j];
    }
    return b;
  }

  // remove :: Int -> [a] -> [a]
  // remove element at index
  function remove(i, a) {
    // eslint-disable-line complexity
    if (i < 0) {
      throw new TypeError('i must be >= 0');
    }

    var l = a.length;
    if (l === 0 || i >= l) {
      // exit early if index beyond end of array
      return a;
    }

    if (l === 1) {
      // exit early if index in bounds and length === 1
      return [];
    }

    return unsafeRemove(i, a, l - 1);
  }

  // unsafeRemove :: Int -> [a] -> Int -> [a]
  // Internal helper to remove element at index
  function unsafeRemove(i, a, l) {
    var b = new Array(l);
    var j = void 0;
    for (j = 0; j < i; ++j) {
      b[j] = a[j];
    }
    for (j = i; j < l; ++j) {
      b[j] = a[j + 1];
    }

    return b;
  }

  // removeAll :: (a -> boolean) -> [a] -> [a]
  // remove all elements matching a predicate
  function removeAll(f, a) {
    var l = a.length;
    var b = new Array(l);
    var j = 0;
    for (var x, i = 0; i < l; ++i) {
      x = a[i];
      if (!f(x)) {
        b[j] = x;
        ++j;
      }
    }

    b.length = j;
    return b;
  }

  // findIndex :: a -> [a] -> Int
  // find index of x in a, from the left
  function findIndex(x, a) {
    for (var i = 0, l = a.length; i < l; ++i) {
      if (x === a[i]) {
        return i;
      }
    }
    return -1;
  }

  // isArrayLike :: * -> boolean
  // Return true iff x is array-like
  function isArrayLike(x) {
    return x != null && typeof x.length === 'number' && typeof x !== 'function';
  }

  /** @license MIT License (c) copyright 2010-2016 original author or authors */

  // id :: a -> a
  var id = function id(x) {
    return x;
  };

  // compose :: (b -> c) -> (a -> b) -> (a -> c)
  var compose = function compose(f, g) {
    return function (x) {
      return f(g(x));
    };
  };

  // apply :: (a -> b) -> a -> b
  var apply = function apply(f, x) {
    return f(x);
  };

  // curry2 :: ((a, b) -> c) -> (a -> b -> c)
  function curry2(f) {
    function curried(a, b) {
      switch (arguments.length) {
        case 0:
          return curried;
        case 1:
          return function (b) {
            return f(a, b);
          };
        default:
          return f(a, b);
      }
    }
    return curried;
  }

  // curry3 :: ((a, b, c) -> d) -> (a -> b -> c -> d)
  function curry3(f) {
    function curried(a, b, c) {
      // eslint-disable-line complexity
      switch (arguments.length) {
        case 0:
          return curried;
        case 1:
          return curry2(function (b, c) {
            return f(a, b, c);
          });
        case 2:
          return function (c) {
            return f(a, b, c);
          };
        default:
          return f(a, b, c);
      }
    }
    return curried;
  }

  exports.cons = cons;
  exports.append = append;
  exports.drop = drop;
  exports.tail = tail;
  exports.copy = copy;
  exports.map = map;
  exports.reduce = reduce;
  exports.replace = replace;
  exports.remove = remove;
  exports.removeAll = removeAll;
  exports.findIndex = findIndex;
  exports.isArrayLike = isArrayLike;
  exports.id = id;
  exports.compose = compose;
  exports.apply = apply;
  exports.curry2 = curry2;
  exports.curry3 = curry3;
});

},{}],3:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var defer = require('../task').defer;

/*global setTimeout, clearTimeout*/

module.exports = ClockTimer;

function ClockTimer() {}

ClockTimer.prototype.now = Date.now;

ClockTimer.prototype.setTimer = function(f, dt) {
	return dt <= 0 ? runAsap(f) : setTimeout(f, dt);
};

ClockTimer.prototype.clearTimer = function(t) {
	return t instanceof Asap ? t.cancel() : clearTimeout(t);
};

function Asap(f) {
	this.f = f;
	this.active = true;
}

Asap.prototype.run = function() {
	return this.active && this.f();
};

Asap.prototype.error = function(e) {
	throw e;
};

Asap.prototype.cancel = function() {
	this.active = false;
};

function runAsap(f) {
	var task = new Asap(f);
	defer(task);
	return task;
}

},{"../task":8}],4:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = ScheduledTask;

function ScheduledTask(delay, period, task, scheduler) {
	this.time = delay;
	this.period = period;
	this.task = task;
	this.scheduler = scheduler;
	this.active = true;
}

ScheduledTask.prototype.run = function() {
	return this.task.run(this.time);
};

ScheduledTask.prototype.error = function(e) {
	return this.task.error(this.time, e);
};

ScheduledTask.prototype.dispose = function() {
	this.scheduler.cancel(this);
	return this.task.dispose();
};

},{}],5:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var base = require('@most/prelude');
var ScheduledTask = require('./ScheduledTask');
var runTask = require('../task').runTask;
var Timeline = require('./Timeline');

module.exports = Scheduler;

function Scheduler(timer, timeline) {
	this.timer = timer;
	this.timeline = timeline;

	this._timer = null;
	this._nextArrival = Infinity;

	var self = this;
	this._runReadyTasksBound = function() {
		self._runReadyTasks(self.now());
	};
}

Scheduler.prototype.now = function() {
	return this.timer.now();
};

Scheduler.prototype.asap = function(task) {
	return this.schedule(0, -1, task);
};

Scheduler.prototype.delay = function(delay, task) {
	return this.schedule(delay, -1, task);
};

Scheduler.prototype.periodic = function(period, task) {
	return this.schedule(0, period, task);
};

Scheduler.prototype.schedule = function(delay, period, task) {
	var now = this.now();
	var st = new ScheduledTask(now + Math.max(0, delay), period, task, this);

	this.timeline.add(st);
	this._scheduleNextRun(now);
	return st;
};

Scheduler.prototype.cancel = function(task) {
	task.active = false;
	if(this.timeline.remove(task)) {
		this._reschedule();
	}
};

Scheduler.prototype.cancelAll = function(f) {
	this.timeline.removeAll(f);
	this._reschedule();
}

Scheduler.prototype._reschedule = function() {
	if(this.timeline.isEmpty()) {
		this._unschedule();
	} else {
		this._scheduleNextRun(this.now());
	}
};

Scheduler.prototype._unschedule = function() {
	this.timer.clearTimer(this._timer);
	this._timer = null;
};

Scheduler.prototype._scheduleNextRun = function(now) {
	if(this.timeline.isEmpty()) {
		return;
	}

	var nextArrival = this.timeline.nextArrival();

	if(this._timer === null) {
		this._scheduleNextArrival(nextArrival, now);
	} else if(nextArrival < this._nextArrival) {
		this._unschedule();
		this._scheduleNextArrival(nextArrival, now);
	}
};

Scheduler.prototype._scheduleNextArrival = function(nextArrival, now) {
	this._nextArrival = nextArrival;
	var delay = Math.max(0, nextArrival - now);
	this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};

Scheduler.prototype._runReadyTasks = function(now) {
	this._timer = null;
	this.timeline.runTasks(now, runTask)
	this._scheduleNextRun(this.now());
};

},{"../task":8,"./ScheduledTask":4,"./Timeline":6,"@most/prelude":2}],6:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var base = require('@most/prelude');

module.exports = Timeline;

function Timeline() {
	this.tasks = [];
}

Timeline.prototype.nextArrival = function() {
	return this.isEmpty() ? Infinity : this.tasks[0].time;
}

Timeline.prototype.isEmpty = function() {
	return this.tasks.length === 0;
}

Timeline.prototype.add = function(st) {
	insertByTime(st, this.tasks);
}

Timeline.prototype.remove = function(st) {
	var i = binarySearch(st.time, this.tasks);

	if(i >= 0 && i < this.tasks.length) {
		var at = base.findIndex(st, this.tasks[i].events);
		if(at >= 0) {
			this.tasks[i].events.splice(at, 1);
			return true;
		}
	}

	return false;
}

Timeline.prototype.removeAll = function(f) {
	for(var i = 0, l = this.tasks.length; i < l; ++i) {
		removeAllFrom(f, this.tasks[i]);
	}
};

Timeline.prototype.runTasks = function(t, runTask) {
	var tasks = this.tasks;
	var l = tasks.length;
	var i = 0;

	while(i < l && tasks[i].time <= t) {
		++i;
	}

	this.tasks = tasks.slice(i);

	// Run all ready tasks
	for (var j = 0; j < i; ++j) {
		this.tasks = runTasks(runTask, tasks[j], this.tasks);
	}
}

function runTasks(runTask, timeslot, tasks) {
	var events = timeslot.events;
	for(var i=0; i<events.length; ++i) {
		var task = events[i];

		if(task.active) {
			runTask(task);

			// Reschedule periodic repeating tasks
			// Check active again, since a task may have canceled itself
			if(task.period >= 0 && task.active) {
				task.time = task.time + task.period;
				insertByTime(task, tasks);
			}
		}
	}

	return tasks;
}

function insertByTime(task, timeslots) {
	var l = timeslots.length;

	if(l === 0) {
		timeslots.push(newTimeslot(task.time, [task]));
		return;
	}

	var i = binarySearch(task.time, timeslots);

	if(i >= l) {
		timeslots.push(newTimeslot(task.time, [task]));
	} else if(task.time === timeslots[i].time) {
		timeslots[i].events.push(task);
	} else {
		timeslots.splice(i, 0, newTimeslot(task.time, [task]));
	}
}

function removeAllFrom(f, timeslot) {
	timeslot.events = base.removeAll(f, timeslot.events);
}

function binarySearch(t, sortedArray) {
	var lo = 0;
	var hi = sortedArray.length;
	var mid, y;

	while (lo < hi) {
		mid = Math.floor((lo + hi) / 2);
		y = sortedArray[mid];

		if (t === y.time) {
			return mid;
		} else if (t < y.time) {
			hi = mid;
		} else {
			lo = mid + 1;
		}
	}
	return hi;
}

function newTimeslot(t, events) {
	return { time: t, events: events };
}

},{"@most/prelude":2}],7:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Scheduler = require('./Scheduler');
var ClockTimer = require('./ClockTimer');
var Timeline = require('./Timeline');

module.exports = new Scheduler(new ClockTimer(), new Timeline());

},{"./ClockTimer":3,"./Scheduler":5,"./Timeline":6}],8:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.defer = defer;
exports.runTask = runTask;

function defer(task) {
	return Promise.resolve(task).then(runTask);
}

function runTask(task) {
	try {
		return task.run();
	} catch(e) {
		return task.error(e);
	}
}

},{}]},{},[1])(1)
});