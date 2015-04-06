angular.module('e50Table').directive('e50Table', function ($parse) {
  return {
    restrict: 'A',
    scope: true,
    controller: function($scope, $attrs) {
      this.$scope = $scope;
      this.$attrs = $attrs;
    },
    compile: function(tElement, tAttrs) {

      // Create ng-repeat on the e50-table-row
      var rows = tElement[0].querySelectorAll('[e50-table-row]');
      angular.forEach(rows, function(row) {
        var rpt = document.createAttribute('ng-repeat');
        var key = 'e50DataKey' in tAttrs ? tAttrs.e50DataKey : 't';
        var prop = 'e50DataProp' in tAttrs ? '.' + tAttrs.e50DataProp : '';
        rpt.value = key + ' in e50FilteredData = (e50GetData()' + prop + ' | orderBy : e50Sort : e50SortReverse | filter : e50Filter) track by $index';
        row.attributes.setNamedItem(rpt);
      });

      return function(scope, element, attrs) {
        var deleted = [];
        var sortLocked = false;

        // Create filtering function
        scope.e50Filter = function(d) {
          if (d && 'id' in d && deleted.indexOf(d.id) >= 0) { return false; }
          if ('e50Filter' in attrs) {
            return $parse(attrs.e50Filter)(scope)(d);
          }
          return true;
        };

        // Create delete row function
        scope.e50DeleteRow = function(t) {
          deleted.push(t.id);
        };

        // Watch sorting attributes for changes
        scope.$watch(function() {
          return [
            $parse(attrs.e50Sort)(scope),
            $parse(attrs.e50SortReverse)(scope)
          ];
        }, function(v) {
          if (!sortLocked) {
            scope.e50Sort = v[0];
            scope.e50SortReverse = v[1];
          }
        }, true);

        // Allow locking the sorting in a particular way dynamically
        scope.$watch(function() {
          return $parse(attrs.e50SortLock)(scope);
        }, function(v) {
          if (v) {
            sortLocked = true;
            for (var i = 0; i < scope.e50FilteredData.length; i++) {
              scope.e50FilteredData[i].e50SortLockIndex = i;
            }
            scope.e50Sort = 'e50SortLockIndex';
            scope.e50SortReverse = false;
          } else {
            sortLocked = false;
            scope.e50Sort = $parse(attrs.e50Sort)(scope);
            scope.e50SortReverse = $parse(attrs.e50SortReverse)(scope);
          }
        });

        // If using an external data array
        if ('e50Data' in attrs) {
          scope.e50GetData = function() {
            return $parse(attrs.e50Data)(scope);
          };
          scope.e50SetData = function(data) {
            $parse(attrs.e50Data).assign(scope.$parent, data);
          };
          scope.$on('$destroy', function() {
          });

        // If maintaining all data locally
        } else {
          var localData = [];
          scope.e50GetData = function() {
            return localData;
          };
          scope.e50SetData = function(data) {
            localData = data;
          };
          scope.$on('$destroy', function() {
          });
        }

      };
    }
  };
});
