'use strict';
angular.module('e50Table').factory('Poll', function($timeout) {

  // Polling class for live data
  function Poll(callback, delay) {
    this.delay = delay !== undefined ? delay : 1000;
    this.callback = callback;
    this.timeout;
    this.poll();
  }

  // Continually run the callback function
  Poll.prototype.poll = function() {
    console.log('updating');
    var that = this;
    this.callback.call().finally(function() {
      that.timeout = $timeout(function() {
        that.poll();
      }, that.delay);
    });
  };

  // Stop polling
  Poll.prototype.stop = function() {
    $timeout.cancel(this.timeout);
  };

  return Poll;
});
