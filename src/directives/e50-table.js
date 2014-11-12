angular.module('e50Table').directive('e50Table', function ($parse, $compile) {
  return {
    restrict: 'A',
    scope: {
      data: '=?e50Data',
      fetchParams: '=?e50FetchParams',
      fetchBody: '=?e50FetchBody',
      sort: '@e50Sort',
      sortOrder: '@e50SortOrder'
    },
    controller: function($scope) {
      this.$scope = $scope;
    },
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
});
