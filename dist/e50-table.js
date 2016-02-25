'use strict';
angular.module('e50Table', ['ngResource']);

angular.module('e50Table').directive('e50DragHandle', function () {
  return {
    restrict: 'A',
    link: function postLink(scope, element) {

      // Add appropriate styles to handle
      element.css({
        cursor: 'move'
      });

      // Prevent browser dragging
      element.on('dragstart', function() {
        return false;
      });

      // Listen for the start of dragging
      element.on('mousedown', function(event) {
        scope.e50StartDrag(event);
      });

    }
  };
});

angular.module('e50Table').directive('e50Drag', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function postLink(scope, element, attrs, ctrl) {

      var $drag, diffTop, diffLeft, iTop, iLeft, rowMap, index;

      // Start dragging the row
      scope.e50StartDrag = function(event) {
        iTop = element[0].getBoundingClientRect().top;
        iLeft = element[0].getBoundingClientRect().left;
        diffTop = event.clientY - iTop;
        diffLeft = event.clientX - iLeft;

        // Get row map and current row index
        rowMap = getRowMap();
        index = getRowIndex();

        // Set the underlying element style
        element.addClass('e50-dragging');
        if ('e50DragClass' in attrs) {
          element.addClass(attrs.e50DragClass);
        }

        // Create the dragging border element
        $drag = angular.element('<div></div>').css({
          position: 'absolute',
          width: element[0].clientWidth,
          height: element[0].clientHeight,
          top: iTop,
          left: iLeft,
          zIndex: 10000000,
          cursor: 'move'
        }).addClass('e50-drag-overlay');
        if ('e50DragOverlayClass' in attrs) {
          $drag.addClass(attrs.e50DragOverlayClass);
        }

        // Add events for moving and stopping
        angular.element('body').append($drag).css({
          userSelect: 'none'

        }).on('mousemove', function(event) {
          // Determine where the thing is dragged
          var cTop = 'e50DragX' in attrs ?
              gravity(iTop, event.clientY - diffTop) : event.clientY - diffTop;
          var cLeft = 'e50DragY' in attrs ?
              gravity(iLeft, event.clientX - diffLeft) : event.clientX - diffLeft;
          $drag.css({ top: cTop, left: cLeft });
          // Determine where to drop it
          moveRow(cTop, cLeft);

        }).on('mouseup', function() {
          $drag.remove();
          element.removeClass('e50-dragging');
          if ('e50DragClass' in attrs) {
            element.removeClass(attrs.e50DragClass);
          }
          angular.element('body').css({
            userSelect: ''
          }).off('mouseup mousemove');
        });
      };

      // Get a map of all row positions in the table
      function getRowMap() {
        var rows = ctrl.$element[0].querySelectorAll('[e50-table-row]');
        var map = [];
        angular.forEach(rows, function(row) {
          map.push({
            top: row.getBoundingClientRect().top,
            left: row.getBoundingClientRect().left
          });
        });
        return map;
      }

      // Get the index of the current row
      function getRowIndex() {
        var key = 'e50DataKey' in ctrl.$attrs ? ctrl.$attrs.e50DataKey : 't';
        scope[key].$$e50FindRow = true;
        for (var i = 0; i < scope.e50FilteredData.length; i++) {
          if (scope.e50FilteredData[i].$$e50FindRow) {
            delete scope[key].$$e50FindRow;
            return i;
          }
        }
      }

      // Optional effect that makes restricting by x or y have 'gravity'
      function gravity(earth, moon) {
        if ('e50DragGravity' in attrs) {
          var r = parseInt(attrs.e50DragGravity) || 0;
          var dist = Math.abs(moon - earth);
          var pull = dist > r ? Math.round(Math.sqrt(dist - r)) + r : dist;
          return earth + (earth < moon ? 1 : -1) * pull;
        } else {
          return earth;
        }
      }

      // Find the closest row location and drop the dragged item
      function moveRow(cTop, cLeft) {
        var closestDist = Number.MAX_VALUE;
        var closestIndex;
        // Find the closest dropzone
        angular.forEach(rowMap, function(row, r) {
          var dTop = row.top - cTop;
          var dLeft = row.left - cLeft;
          var dist = Math.sqrt(dTop*dTop + dLeft*dLeft);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = r;
          }
        });
        // Reorder the list and recalculate map
        if (index !== closestIndex) {
          scope.e50MoveData(index, closestIndex);
          index = closestIndex;
          rowMap = getRowMap();
        }
      }

    }
  };
});

angular.module('e50Table').directive('e50Fetch', ["$parse", "$resource", "E50Poll", "$timeout", function ($parse, $resource, E50Poll, $timeout) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      var fetching = false;
      var hasMore = true;
      var polling = 'e50Poll' in attrs;
      var infinite = 'e50InfiniteScroll' in attrs;
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
        // If it's not a poll, increment the fetchNum counter
        var curFetchNum = fetchNum;
        if (!isPoll) {
          fetchNum++;
          curFetchNum = fetchNum;
        }
        var promise = fetchResource.fetch(params,body).$promise.then(
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
              if (infinite) {
                $timeout(scope.e50InfiniteScroll);
              }
            } else if (isScroll) {
              hasMore = false;
            }
            // Optional success handling
            if ('e50IfSuccess' in attrs) {
              $parse(attrs.e50IfSuccess)(scope)(response);
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
          hasFetched = true;
        });
        if ('e50Loading' in attrs && !isPoll && !isScroll) {
          if (attrs.e50Loading !== 'emit') { scope.$broadcast('loading', promise, 'e50-table-loading', true); }
          if (attrs.e50Loading !== 'broadcast') { scope.$emit('loading', promise, 'e50-table-loading', true); }
        }
        if ('e50InfiniteLoading' in attrs && isScroll) {
          if (attrs.e50InfiniteLoading !== 'emit') { scope.$broadcast('loading', promise, 'e50-table-infinite-loading', true); }
          if (attrs.e50InfiniteLoading !== 'broadcast') { scope.$emit('loading', promise, 'e50-table-infinite-loading', true); }
        }
        return promise;
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
        var poll = new E50Poll(function() {
          return fetch(true);
        }, attrs.e50Poll);
        scope.$on('$destroy', function() {
          poll.stop();
        });
      }

      // Listen for infinite scroll
      scope.$on('e50-infinite-scroll', function() {
        // If not currently fetching and there's more to get
        if (!fetching && hasMore) {
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

angular.module('e50Table').directive('e50InfiniteScroll', ["$parse", function ($parse) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      var scrollParent = false;
      var scrollNum = 0;

      // Set up infinite scroll event
      scope.e50InfiniteScroll = function(redraw) {
        var currentNum = scrollNum;
        // Find the scrolling parent element
        if (!scrollParent || redraw) {
          scrollParent = scrollParentFn(element);
        }
        scrollParent.off('scroll.e50Table');
        scrollParent.on('scroll.e50Table', function() {
          var lasts = element[0].querySelectorAll('[e50-table-row]:last-child');
          angular.forEach(lasts, function(last) {
            if (currentNum === scrollNum &&
                last.offsetHeight &&
                last.offsetTop + last.offsetHeight < scrollParent[0].scrollTop + scrollParent[0].offsetHeight + 200) {
              // Don't fire event more than once per scroll
              scrollNum++;
              scope.$broadcast('e50-infinite-scroll');
              if (attrs.e50InfiniteScroll) {
                // Call custom function with callback to rewatch for infinite scroll
                $parse(attrs.e50InfiniteScroll)(scope)(function(redraw) {
                  scope.e50InfiniteScroll(redraw);
                });
              }
            }
          });
        });
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
    controller: ["$element", "$attrs", function($element, $attrs) {
      this.$element = $element;
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
            ' | orderBy : e50Sort : e50SortReverse | filter : e50Filter | limitTo : e50LimitTo)';
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
}]);

angular.module('e50Table').directive('e50View', ["$timeout", function ($timeout) {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs, ctrl) {

      // Hide & show the element based on current view
      function changeView(v) {
        if (v === attrs.e50View) {
          element.removeClass('ng-hide');
          $timeout(function() {
            if (scope.e50InfiniteScroll) {
              scope.e50InfiniteScroll(true);
            }
          });
        } else {
          element.addClass('ng-hide');
        }
      }

      // Watch for view changes
      changeView(ctrl.$attrs.e50Views);
      ctrl.$attrs.$observe('e50Views', changeView);

    }
  };
}]);

angular.module('e50Table').factory('E50Poll', ["$timeout", function($timeout) {

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

}]);
