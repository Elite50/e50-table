'use strict';
angular.module('e50Table', ['ngResource']);

angular.module('e50Table').directive('e50Fetch', ["$parse", "$resource", "Poll", function ($parse, $resource, Poll) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      // Define the resource to fetch from
      var fetchResource = $resource(attrs.e50Fetch, {}, {
        fetch: {
          method: 'e50FetchMethod' in attrs ? attrs.e50FetchMethod : 'GET'
        }
      });

      // Fetch the table data
      function fetch() {
        return fetchResource.fetch(
          $parse(attrs.e50FetchParams)(scope),
          $parse(attrs.e50FetchBody)(scope)
        ).$promise.then(function(response) {
          if (!angular.equals(scope.e50GetData(),response.data)) {
            scope.e50SetData(response.data);
          }
        });
      }

      // Only fetch once if desired
      if ('e50FetchOnce' in attrs) {
        fetch();
      // Otherwise, fetch whenever the params change
      } else {
        scope.$watch(function() {
          return [
            $parse(attrs.e50FetchParams)(scope),
            $parse(attrs.e50FetchBody)(scope)
          ];
        }, fetch, true);
      }

      // Start polling if element has poll attr
      if ('e50Poll' in attrs) {
        var poll = new Poll(fetch, attrs.e50Poll);
        scope.$on('$destroy', function() {
          poll.stop();
        });
      }

    }
  };
}]);

angular.module('e50Table').directive('e50Hover', function () {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {

      // Add hover class for mousing over rows
      var hoverClass = attrs.e50Hover ? attrs.e50Hover : 'hover';
      element.on('mouseenter', function() {
        element.addClass(hoverClass);
      }).on('mouseleave', function() {
        element.removeClass(hoverClass);
      });

    }
  };
});

angular.module('e50Table').directive('e50IfData', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs) {

      var show = attrs.e50IfData !== 'false';
      var replace = attrs.e50IfNoData ? attrs.e50IfNoData : null;
      var $none = angular.element('<div class="e50-no-data">'+replace+'</div>');

      // Hide & show the element based on data status
      scope.$watchCollection('e50GetData()', function(v) {
        if (v.length && show || !(v.length || show)) {
          if (replace) {
            $none.remove();
          }
          element.removeClass('ng-hide');
        } else {
          if (replace) {
            element.parent()[0].insertBefore($none[0], element[0]);
          }
          element.addClass('ng-hide');
        }
      });

    }
  };
});

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

angular.module('e50Table').directive('e50Table', ["$parse", function ($parse) {
  return {
    restrict: 'A',
    scope: true,
    controller: ["$scope", function($scope) {
      this.$scope = $scope;
    }],
    compile: function(tElement, tAttrs) {

      // Create ng-repeat on the e50-table-row
      var row = tElement[0].querySelector('[e50-table-row]');
      var rpt = document.createAttribute('ng-repeat');
      var key = tAttrs.e50DataKey ? tAttrs.e50DataKey : 't';
      rpt.value = key + ' in e50GetData() | orderBy : e50Sort : e50SortReverse | filter : e50Filter';
      row.attributes.setNamedItem(rpt);

      return function(scope, element, attrs) {
        // Create filtering function
        scope.e50Filter = function(d) {
          if ('e50Filter' in attrs) {
            return $parse(attrs.e50Filter)(scope)(d);
          }
          return true;
        };

        // Create delete row function
        scope.e50DeleteRow = function(t) {
          angular.forEach(scope.e50GetData(), function(row, r) {
            if (row === t) { scope.e50GetData().splice(r, 1); }
          });
        };

        // Observe sorting attributes for interpolated changes
        attrs.$observe('e50Sort', function(v) {
          scope.e50Sort = v;
        });
        attrs.$observe('e50SortReverse', function(v) {
          scope.e50SortReverse = v;
        });

        // If using an external data array
        if ('e50Data' in attrs) {
          scope.e50GetData = function() {
            return $parse(attrs.e50Data)(scope);
          };
          scope.e50SetData = function(data) {
            $parse(attrs.e50Data).assign(scope.$parent, data);
          };

        // If maintaining all data locally
        } else {
          var localData = [];
          scope.e50GetData = function() {
            return localData;
          };
          scope.e50SetData = function(data) {
            localData = data;
          };
        }

      };
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
