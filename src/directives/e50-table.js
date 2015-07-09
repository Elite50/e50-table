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
        rpt.value = key + ' in e50FilteredData = (e50GetData()' + prop +
            ' | orderBy : e50Sort : e50SortReverse | filter : e50Filter)';
        row.attributes.setNamedItem(rpt);
      });

      return function(scope, element, attrs) {
        var deleted = [];
        var sortLocked = false;

        function getDataArrayIndex(v) {
          var data = scope.e50GetData();
          if ('e50DataProp' in attrs) {
            data = data[attrs.e50DataProp];
          }
          return data.indexOf(v);
        }

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
            scope.e50Sort = v[0] ? v[0] : getDataArrayIndex;
            scope.e50SortReverse = v[1] ? true : false;
          }
        }, true);

        // Allow locking the sorting in a particular way dynamically
        scope.$watch(function() {
          return $parse(attrs.e50SortLock)(scope);
        }, function(v) {
          if (v) {
            sortLocked = true;
            for (var i = 0; i < scope.e50FilteredData.length; i++) {
              scope.e50FilteredData[i].$$e50SortLockIndex = i;
            }
            scope.e50Sort = '$$e50SortLockIndex';
            scope.e50SortReverse = false;
          } else {
            sortLocked = false;
            var sort = $parse(attrs.e50Sort)(scope);
            scope.e50Sort = sort ? sort : getDataArrayIndex;
            scope.e50SortReverse = $parse(attrs.e50SortReverse)(scope) ? true : false;
          }
        });

        // If using an external data array
        if ('e50Data' in attrs) {
          scope.e50GetData = function() {
            return $parse(attrs.e50Data)(scope);
          };
          scope.e50SetData = function(data) {
            smartUpdate($parse(attrs.e50Data)(scope), data, false);
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
            smartUpdate(localData, data, true);
          };
          scope.$on('$destroy', function() {
          });
        }

        function applyData(newData, local) {
            if (local) {
              localData = newData;
            } else {
              $parse(attrs.e50Data).assign(scope.$parent, newData);
            }
        }

        function smartUpdate(oldData, newData, local) {
          // If anything is undefined, just assign
          if (typeof oldData === 'undefined' || typeof newData === 'undefined') {
            return applyData(newData, local);
          }
          // Determine the actual lists
          var oldDataList = oldData;
          var newDataList = newData;
          if ('e50DataProp' in attrs && typeof newData !== 'undefined') {
            oldDataList = oldData[attrs.e50DataProp] ? oldData[attrs.e50DataProp] : [];
            newDataList = newData[attrs.e50DataProp] ? newData[attrs.e50DataProp] : [];
            // Update any non-list properties
            for (var p in oldData) {
              if (p !== attrs.e50DataProp && !angular.equals(oldData[p], newData[p])) {
                oldData[p] = newData[p];
              }
            }
          }
          // If old list is empty, just assign
          if (!oldDataList.length) {
            return applyData(newData, local);
          }
          // Otherwise, do the smart update
          for (var i = 0, done = false; !done; i++) {
            if (i === oldDataList.length) {
              // If the old list has run out
              done = true;
              Array.prototype.push.apply(oldDataList, newDataList.slice(i, newDataList.length));
            } else if (i === newDataList.length) {
              // If the new list has run out
              done = true;
              oldDataList.splice(i, oldDataList.length - i);
            } else {
              if (!angular.equals(oldDataList[i], newDataList[i])) {
                oldDataList[i] = newDataList[i];
              }
            }
          }
        }

      };
    }
  };
});
