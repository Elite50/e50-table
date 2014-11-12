angular.module('e50Table').directive('e50Table', function ($interval, Poll, $parse, $compile, $resource) {
  return {
    restrict: 'A',
    scope: {
      data: '=?e50Data',
      use: '@e50Use',
      rowHover: '@e50RowHover',
      fetch: '@e50Fetch',
      fetchParams: '=?e50FetchParams',
      fetchMethod: '@e50FetchMethod',
      fetchBody: '=?e50FetchBody',
      poll: '@e50Poll',
      sort: '@e50Sort',
      sortOrder: '@e50SortOrder'
    },
    link: function postLink(scope, element, attrs) {
      var $tbody = element.find('tbody');
      var $row = $tbody.find('tr');
      var pScope = {};

      // Add references to 'used' scope variables to simulate closure
      if (scope.use !== undefined) {
        scope.use = scope.use.split(scope.use.indexOf(';')>0?';':',');
        angular.forEach(scope.use, function(ref) {
          pScope[ref] = $parse(ref)(scope.$parent);
        });
      }

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

      // Create the actual row markup
      function update() {
        $tbody.empty();
        var tableData = angular.copy(scope.data);
        // Optionally sort the data
        if (scope.sort !== undefined) {
          tableData.sort(sort);
        }
        angular.forEach(tableData, function(d) {
          var newScope = scope.$new(true);
          angular.extend(newScope, d);
          angular.extend(newScope, pScope);
          var compiled = $compile($row.clone())(newScope);
          // Possibly add hover class for mousing over rows
          if (typeof attrs.e50RowHover !== 'undefined') {
            var hoverClass = scope.rowHover.length ? scope.rowHover : 'hover';
            compiled.on('mouseenter', function() {
              compiled.addClass(hoverClass);
            }).on('mouseleave', function() {
              compiled.removeClass(hoverClass);
            });
          }
          $tbody.append(compiled);
        });
        // Prevent click propagation in elems with attr e50-no-prop
        angular.element(element[0].querySelectorAll('[e50-no-prop]'))
        .on('click', function(e) {
          e.stopPropagation();
        });
      }

      scope.$watch('data', function() {
        update();
      }, true);

      // Watch for changes to data
      scope.$watchCollection('[sort, sortOrder]', function() {
        update();
      });

      // If loading data dynamically
      if (scope.fetch) {
        var fetchResource = $resource(scope.fetch, {}, {
          fetch: { method: scope.fetchMethod !== undefined ? scope.fetchMethod : 'GET' }
        });
        var fetch = function() {
          return fetchResource.fetch(scope.fetchParams, scope.fetchBody).$promise
            .then(function(response) {
              scope.data = response.data;
            });
        };
        // Only fetch once if desired
        if (typeof attrs.e50FetchOnce !== 'undefined') {
          fetch();
          // Otherwise, fetch whenever the params change
        } else {
          scope.$watchCollection('[fetchParams, fetchBody]', fetch);
        }

        // Start polling if element has poll attr
        if (typeof attrs.e50Poll !== 'undefined') {
          var poll = new Poll(fetch, scope.poll);
          scope.$on('$destroy', function() {
            poll.stop();
          });
        }
      }
    }
  };
});
