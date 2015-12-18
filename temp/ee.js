'use strict';

const events = require('events');
const EventEmitter = events.EventEmitter;

class A extends events.EventEmitter {
  constructor(options) {
    super();
    this.id = 123;
    console.log(this, options);
  }

  asd() {
    console.log(this);
  }
}

let a = new A({});
a.asd();