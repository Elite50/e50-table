'use strict';
angular.module('e50Table', ['ngResource']);

angular.module('e50Table').directive('e50Fetch', ["$resource", "Poll", function ($resource, Poll) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function postLink(scope, element, attrs, ctrl) {

      // Define the resource to fetch from
      var fetchResource = $resource(attrs.e50Fetch, {}, {
        fetch: {
          method: 'e50FetchMethod' in attrs ? attrs.e50FetchMethod : 'GET'
        }
      });

      // Fetch the table data
      function fetch() {
        return fetchResource.fetch(
          ctrl.$scope.fetchParams,
          ctrl.$scope.fetchBody
        ).$promise.then(function(response) {
          ctrl.$scope.data = response.data;
        });
      }

      // Only fetch once if desired
      if ('e50FetchOnce' in attrs) {
        fetch();
      // Otherwise, fetch whenever the params change
      } else {
        ctrl.$scope.$watch('[fetchParams, fetchBody]', fetch, true);
      }

      // Start polling if element has poll attr
      if ('e50Poll' in attrs) {
        var poll = new Poll(fetch, attrs.e50Poll);
        ctrl.$scope.$on('$destroy', function() {
          poll.stop();
        });
      }

    }
  };
}]);

angular.module('e50Table').directive('e50NoProp', function () {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      element.on('click', function(e) {
        e.stopPropagation();
      });
    }
  };
});

angular.module('e50Table').directive('e50TableRow', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function postLink(scope, element, attrs, ctrl) {

      // Possibly add hover class for mousing over rows
      if ('e50Hover' in attrs) {
        var hoverClass = attrs.e50Hover ? attrs.e50Hover : 'hover';
        element.on('mouseenter', function() {
          element.addClass(hoverClass);
        }).on('mouseleave', function() {
          element.removeClass(hoverClass);
        });
      }

    }
  };
});

angular.module('e50Table').directive('e50Table', ["$parse", "$compile", function ($parse, $compile) {
  return {
    restrict: 'A',
    scope: {
      data: '=?e50Data',
      fetchParams: '=?e50FetchParams',
      fetchBody: '=?e50FetchBody',
      sort: '@e50Sort',
      sortOrder: '@e50SortOrder'
    },
    controller: ["$scope", function($scope) {
      this.$scope = $scope;
    }],
    link: function postLink(scope, element, attrs) {

      var $row = element[0].querySelector('[e50-table-row]');
      $row = angular.element($row);
      var $tbody = $row.parent();

      // Add references to 'used' scope variables to simulate closure
      var pScope = {};
      if ('e50Use' in attrs) {
        // Split on commas, unless there's a semicolon present
        var refs = attrs.e50Use.split(attrs.e50Use.indexOf(';')>0?';':',');
        angular.forEach(refs, function(ref) {
          pScope[ref] = $parse(ref)(scope.$parent);
        });
      }

      // Create the actual row markup
      function update() {
        $tbody.empty();
        var tableData = angular.copy(scope.data);
        // Optionally sort the data
        if ('e50Sort' in attrs) {
          tableData.sort(sort);
        }
        // Append and compile each row
        angular.forEach(tableData, function(d) {
          var newScope = scope.$new(true);
          // Add the row data
          angular.extend(newScope, d);
          // Add the 'used' data
          angular.extend(newScope, pScope);
          var $newRow = $row.clone();
          $tbody.append($newRow);
          $compile($newRow)(newScope);
        });
      }

      // Watch for changes that require table re-draw
      scope.$watch('[data, sort, sortOrder]', function() {
        update();
      }, true);

      // Sort based on data key and provided order
      function sort(a, b) {
        var order = scope.sortOrder === 'desc' ? 'desc' : 'asc';
        if (a[scope.sort] < b[scope.sort]) {
          return order === 'asc' ? -1 : 1;
        } else if (a[scope.sort] > b[scope.sort]) {
          return order === 'asc' ? 1 : -1;
        } else {
          return 0;
        }
      }

    }
  };
}]);

angular.module('e50Table').factory('Poll', ["$timeout", function($timeout) {

  // Polling class for live data
  function Poll(callback, delay) {
    this.delay = delay ? delay : 1000;
    this.callback = callback;
    this.poll();
  }

  // Continually run the callback function
  Poll.prototype.poll = function() {
    var that = this;
    this.callback().finally(function() {
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

}]);
