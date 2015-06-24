'use strict';
angular.module('e50Table', ['ngResource']);

angular.module('e50Table').directive('e50Fetch', ["$parse", "$resource", "Poll", "$timeout", function ($parse, $resource, Poll, $timeout) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      var fetching = false;
      var hasMore = true;
      var polling = 'e50Poll' in attrs;
      var infinite = 'e50InfiniteScroll' in attrs;
      var scrollParent = false;
      var hasFetched = false;
      var fetchNum = 0;

      // Get initial params and body
      var params = angular.copy($parse(attrs.e50FetchParams)(scope));
      var body = angular.copy($parse(attrs.e50FetchBody)(scope));

      // If infinite scrolling enabled
      if (infinite) {
        // Get initial limit and offset
        var offsetKey = 'e50OffsetKey' in attrs ? attrs.e50OffsetKey : 'offset';
        var limitKey = 'e50LimitKey' in attrs ? attrs.e50LimitKey : 'limit';
        var offset = params && offsetKey in params ? params[offsetKey] : body[offsetKey];
        var limit = params && limitKey in params ? params[limitKey] : body[limitKey];
        var initialLimit = limit;
      }

      // Define the resource to fetch from
      var fetchResource = $resource(attrs.e50Fetch, {}, {
        fetch: {
          method: 'e50FetchMethod' in attrs ? attrs.e50FetchMethod : 'GET'
        }
      });

      // Fetch the table data
      function fetch(isPoll, isScroll) {
        fetching = true;
        params = angular.copy($parse(attrs.e50FetchParams)(scope));
        body = angular.copy($parse(attrs.e50FetchBody)(scope));
        var append = false;
        // Force the empty loader to work right
        if (!isPoll && scope.e50FilteredData && !scope.e50FilteredData.length) {
          scope.e50SetData(undefined);
        }
        if (infinite) {
          var oObj = (params && offsetKey in params) ? params : body;
          var lObj = (params && limitKey in params) ? params : body;
          // If it's a non-polling infinite scroll, fetch the next several rows
          if (isScroll && !polling) {
            oObj[offsetKey] = offset;
            append = true;
          // If it's a polling poll or scroll, fetch all with the increased limit
          } else if (polling && (isPoll || isScroll)) {
            lObj[limitKey] = limit;
          // Otherwise, reset everything because some other parameter has changed
          } else {
            offset = oObj[offsetKey];
            limit = lObj[limitKey];
          }
        }
        if ('e50Loading' in attrs && !isPoll && !isScroll && hasFetched) {
          if (attrs.e50Loading !== 'emit') { scope.$broadcast('loading-show', 'e50-table-loading'); }
          if (attrs.e50Loading !== 'broadcast') { scope.$emit('loading-show', 'e50-table-loading'); }
        }
        if ('e50InfiniteLoading' in attrs && isScroll) {
          if (attrs.e50InfiniteLoading !== 'emit') { scope.$broadcast('loading-show', 'e50-table-infinite-loading'); }
          if (attrs.e50InfiniteLoading !== 'broadcast') { scope.$emit('loading-show', 'e50-table-infinite-loading'); }
        }
        // If it's not a poll, increment the fetchNum counter
        var curFetchNum = fetchNum;
        if (!isPoll) {
          fetchNum++;
          curFetchNum = fetchNum;
        }
        return fetchResource.fetch(params,body).$promise.then(
          function(response) {
            // The params have been changed, don't use this request
            if (curFetchNum !== fetchNum) {
              return;
            }
            // If the data has changed
            if (!angular.equals(scope.e50GetData(),response.data)) {
              hasMore = true;
              // If appending
              if (append) {
                var args = response.data;
                var array = scope.e50GetData();
                if ('e50DataProp' in attrs) {
                  args = args[attrs.e50DataProp];
                  array = array[attrs.e50DataProp];
                }
                if (!args.length) { hasMore = false; }
                Array.prototype.push.apply(array, args);
              // If replacing
              } else {
                scope.e50SetData(response.data);
              }
              $timeout(scope.e50InfiniteScroll);
            } else if (isScroll) {
              hasMore = false;
            }
          },
          function(response) {
            // Optional error handling
            if ('e50IfError' in attrs) {
              $parse(attrs.e50IfError)(scope)(response);
            }
          }
        ).finally(function() {
          fetching = false;
          if ('e50Loading' in attrs && !isPoll && !isScroll && hasFetched) {
            if (attrs.e50Loading !== 'emit') { scope.$broadcast('loading-hide', 'e50-table-loading'); }
            if (attrs.e50Loading !== 'broadcast') { scope.$emit('loading-hide', 'e50-table-loading'); }
          }
          if ('e50InfiniteLoading' in attrs && isScroll) {
            if (attrs.e50InfiniteLoading !== 'emit') { scope.$broadcast('loading-hide', 'e50-table-infinite-loading'); }
            if (attrs.e50InfiniteLoading !== 'broadcast') { scope.$emit('loading-hide', 'e50-table-infinite-loading'); }
          }
          hasFetched = true;
        });
      }

      // Only fetch once if desired
      if ('e50FetchOnce' in attrs) {
        fetch();

      // Otherwise fetch regularly
      } else {
        scope.$watch(function() {
          return [
            $parse(attrs.e50FetchParams)(scope),
            $parse(attrs.e50FetchBody)(scope)
          ];
        }, function() {
          // Don't fetch if sorting should be done client-side
          if (!hasFetched ||
              !('e50FetchLimit' in attrs && 'e50FetchLimitProp' in attrs &&
                scope.e50GetData()[attrs.e50FetchLimitProp] <=
                attrs.e50FetchLimit)) {
            fetch();
          }
        }, true);
      }

      // Start polling if element has poll attribute
      if (polling) {
        var poll = new Poll(function() {
          return fetch(true);
        }, attrs.e50Poll);
        scope.$on('$destroy', function() {
          poll.stop();
        });
      }

      // Set up infinite scroll event
      scope.e50InfiniteScroll = function(redraw) {
        if (infinite) {
          // Find the scrolling parent element
          if (!scrollParent || redraw) {
            scrollParent = scrollParentFn(element);
          }
          scrollParent.off('scroll');
          scrollParent.on('scroll', function() {
            var lasts = element[0].querySelectorAll('[e50-table-row]:last-child');
            angular.forEach(lasts, function(last) {
              if (last.offsetHeight && last.offsetTop < scrollParent[0].scrollTop +
                  scrollParent[0].offsetHeight + 2*last.offsetHeight && !fetching && hasMore) {
                // If polling, just up the total limit
                if (polling) {
                  limit += initialLimit;
                // Otherwise, fetch the next several rows
                } else {
                  offset += limit;
                }
                fetch(false, true);
              }
            });
          });
        }
      };
      scope.e50InfiniteScroll();

      /**
       * Determines the first scrollable parent of an element
       *
       * jQLite implementation, adapted from slindberg/jquery-scrollparent
       */
      function scrollParentFn(elem) {
        var position = elem.css('position');
        var excludeStaticParent = position === 'absolute';
        var parentElem;
        for (parentElem = elem.parent(); parentElem[0]; parentElem = parentElem.parent()) {
          if (excludeStaticParent && parentElem.css('position') === 'static') {
            continue;
          }
          if ((/(auto|scroll)/).test(parentElem.css('overflow') +
                parentElem.css('overflow-y') + parentElem.css('overflow-x'))) {
            break;
          }
        }
        return position === 'fixed' || !parentElem ? angular.element(elem[0].ownerDocument || document) : parentElem;
      }

    }
  };
}]);

angular.module('e50Table').directive('e50Hover', ["$parse", function ($parse) {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {

      // Add hover class for mousing over rows
      var hoverClass = attrs.e50Hover ? attrs.e50Hover : 'hover';
      element.on('mouseenter', function() {
        if (!('e50HoverIf' in attrs) || $parse(attrs.e50HoverIf)(scope)) {
          element.addClass(hoverClass);
        }
      }).on('mouseleave', function() {
        element.removeClass(hoverClass);
      });

    }
  };
}]);

angular.module('e50Table').directive('e50IfData', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs) {

      var show = attrs.e50IfData !== 'false';
      var replace = attrs.e50IfNoData ? attrs.e50IfNoData : null;
      var $none = angular.element('<div class="e50-no-data">'+replace+'</div>');
      var loading = 'e50IfLoadingData' in attrs ?
        (attrs.e50IfLoadingData.length ? attrs.e50IfLoadingData : 'Loading data') : null;
      var $noneL = angular.element('<div class="e50-no-data">'+loading+'</div>');

      // Hide & show the element based on data status
      scope.$watchCollection('e50FilteredData', function(data) {

        // If nothing has ever been successfully fetched
        if (typeof data === 'undefined') {
          if (loading) {
            element.parent()[0].insertBefore($noneL[0], element[0]);
          }
          $none.remove();
          if (show) {
            element.css('display', 'none');
          } else {
            element.css('display', '');
          }

        // If the data is empty
        } else if (!data.length) {
          if (replace) {
            element.parent()[0].insertBefore($none[0], element[0]);
          }
          $noneL.remove();
          if (show) {
            element.css('display', 'none');
          } else {
            element.css('display', '');
          }

        // If data is fine and dandy
        } else {
          $none.remove();
          $noneL.remove();
          if (show) {
            element.css('display', '');
          } else {
            element.css('display', 'none');
          }
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
    controller: ["$scope", "$attrs", function($scope, $attrs) {
      this.$scope = $scope;
      this.$attrs = $attrs;
    }],
    compile: function(tElement, tAttrs) {

      // Create ng-repeat on the e50-table-row
      var rows = tElement[0].querySelectorAll('[e50-table-row]');
      angular.forEach(rows, function(row) {
        var rpt = document.createAttribute('ng-repeat');
        var key = 'e50DataKey' in tAttrs ? tAttrs.e50DataKey : 't';
        var prop = 'e50DataProp' in tAttrs ? '.' + tAttrs.e50DataProp : '';
        rpt.value = key + ' in e50FilteredData = (e50GetData()' + prop +
            ' | orderBy : e50Sort : e50SortReverse | filter : e50Filter) track by $index';
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
              scope.e50FilteredData[i].e50SortLockIndex = i;
            }
            scope.e50Sort = 'e50SortLockIndex';
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

        function smartUpdate(oldData, newData, local) {
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
          // If it's empty, just assign
          if (!oldDataList.length) {
            if (local) {
              localData = newData;
            } else {
              $parse(attrs.e50Data).assign(scope.$parent, newData);
            }
          }
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
}]);

angular.module('e50Table').directive('e50View', ["$timeout", function ($timeout) {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs, ctrl) {

      // Hide & show the element based on current view
      ctrl.$attrs.$observe('e50Views', function(v) {
        if (v === attrs.e50View) {
          element.removeClass('ng-hide');
          $timeout(function() {
            scope.e50InfiniteScroll(true);
          });
        } else {
          element.addClass('ng-hide');
        }
      });

    }
  };
}]);

angular.module('e50Table').factory('Poll', ["$timeout", function($timeout) {

  // Polling class for live data
  function Poll(callback, delay) {
    this.delay = delay ? delay : 1000;
    this.callback = callback;
    this.canceled = false;
    this.wait();
  }

  // Continually run the callback function
  Poll.prototype.poll = function() {
    var that = this;
    // Fetch only if the document has focus
    if (document.hasFocus()) {
      this.callback().finally(function() {
        if (!that.canceled) {
          that.wait();
        }
      });
    } else {
      this.wait();
    }
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

}]);
