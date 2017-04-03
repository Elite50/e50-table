angular.module('e50Table').directive('e50Table', function ($parse) {
  return {
    restrict: 'A',
    scope: true,
    controller: function($element, $attrs) {
      this.$element = $element;
      this.$attrs = $attrs;
    },
    compile: function(tElement, tAttrs) {

      // Create ng-repeat on the e50-table-row
      var attrValue = tAttrs.e50Table ? '=' + tAttrs.e50Table : '';
      var rows = tElement[0].querySelectorAll('[e50-table-row' + attrValue + ']');
      angular.forEach(rows, function(row) {
        // Add ng-repeat-start
        var rpt = document.createAttribute('ng-repeat-start');
        var key = 'e50DataKey' in tAttrs ? tAttrs.e50DataKey : 't';
        var prop = 'e50DataProp' in tAttrs ? '.' + tAttrs.e50DataProp : '';
        rpt.value = key + ' in e50FilteredData = (e50GetData()' + prop +
            ' | orderBy : e50Sort : e50SortReverse | filter : e50Filter | limitTo : e50LimitTo)';
        row.attributes.setNamedItem(rpt);

        // Add ng-repeat-end
        var end = row;
        var next = row;
        do {
          next = next.nextElementSibling;
          if (next && next.hasAttribute('e50-table-row-end')) {
            end = next;
            break;
          }
        } while (next);
        end.attributes.setNamedItem(document.createAttribute('ng-repeat-end'));
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
        scope.e50Filter = function(d, index, array) {
          if (d && 'id' in d && deleted.indexOf(d.id) >= 0) { return false; }

          var display = true;

          // Apply filtering
          if ('e50Filter' in attrs) {
            display = $parse(attrs.e50Filter)(scope)(d);
          }

          // Filter out duplicates
          if ('e50Deduplicate' in attrs) {
            var dedupeFn;
            if (attrs.e50Deduplicate) {
              dedupeFn = $parse(attrs.e50Deduplicate)(scope);
            } else {
              dedupeFn = function(a, b) {
                return angular.equals(a, b);
              };
            }
            for (var i = 0; i < index; i++) {
              if (dedupeFn(d, array[i])) {
                display = false;
              }
            }
          }

          return display;
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

        // Watch limiting attribute for changes
        scope.$watch(function() {
          return [
            $parse(attrs.e50LimitTo)(scope)
          ];
        }, function(v) {
          // Using an arbitrarily high number is hacky but unavoidable with Angular 1.3
          scope.e50LimitTo = v[0] ? v[0] : 4815162342;
        }, true);

        // If using an external data array
        if ('e50Data' in attrs) {
          scope.e50GetData = function() {
            return $parse(attrs.e50Data)(scope);
          };
          scope.e50SetData = function(data) {
            smartUpdate($parse(attrs.e50Data)(scope), data, false);
          };

        // If maintaining all data locally
        } else {
          var localData = [];
          scope.e50GetData = function() {
            return localData;
          };
          scope.e50SetData = function(data) {
            smartUpdate(localData, data, true);
          };
        }

        // Move an item from one visible index to another
        scope.e50MoveData = function(from, to) {
          var dataList = scope.e50GetData();
          if ('e50DataProp' in attrs) {
            dataList = dataList[attrs.e50DataProp] ? dataList[attrs.e50DataProp] : [];
          }
          scope.e50FilteredData[from].$$e50MoveFrom = true;
          scope.e50FilteredData[to].$$e50MoveTo = true;
          var realFrom, realTo;
          angular.forEach(dataList, function(data, d) {
            if (data.$$e50MoveFrom) {
              realFrom = d;
              delete data.$$e50MoveFrom;
            }
            if (data.$$e50MoveTo) {
              realTo = d;
              delete data.$$e50MoveTo;
            }
          });
          dataList.splice(realTo, 0, dataList.splice(realFrom, 1)[0]);
          scope.$digest();
        };

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
          if ('e50DataProp' in attrs) {
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
