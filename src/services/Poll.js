angular.module('e50Table').factory('Poll', function($timeout) {

  // Polling class for live data
  function Poll(callback, delay) {
    this.delay = delay ? delay : 1000;
    this.callback = callback;
    this.poll();
    this.canceled = false;
  }

  // Continually run the callback function
  Poll.prototype.poll = function() {
    var that = this;
    this.callback().finally(function() {
      if (!that.canceled) {
        that.timeout = $timeout(function() {
          that.poll();
        }, that.delay);
      }
    });
  };

  // Stop polling
  Poll.prototype.stop = function() {
    this.canceled = true;
    $timeout.cancel(this.timeout);
  };

  return Poll;

});
