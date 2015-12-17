angular.module('e50Table').factory('E50Poll', function($timeout) {

  // Polling class for live data
  function Poll(callback, delay) {
    console.log('hi');
    this.delay = delay ? delay : 1000;
    this.callback = callback;
    this.canceled = false;
    this.wait();
  }

  // Continually run the callback function
  Poll.prototype.poll = function() {
    var that = this;
    this.callback().finally(function() {
      if (!that.canceled) {
        that.wait();
      }
    });
  };

  // Run the polling function after a timeout
  Poll.prototype.wait = function() {
    var that = this;
    this.timeout = $timeout(function() {
      that.poll();
    }, this.delay);
  };

  // Stop polling
  Poll.prototype.stop = function() {
    this.canceled = true;
    $timeout.cancel(this.timeout);
  };

  return Poll;

});
