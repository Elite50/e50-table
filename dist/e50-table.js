'use strict';
angular.module('e50Table', ['ngResource']);

angular.module('e50Table').directive('e50Fetch', ["$parse", "$resource", "Poll", function ($parse, $resource, Poll) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      var fetching = false;
      var polling = 'e50Poll' in attrs;
      var infinite = 'e50InfiniteScroll' in attrs;

      // Get initial params and body
      var params = angular.copy($parse(attrs.e50FetchParams)(scope));
      var body = angular.copy($parse(attrs.e50FetchBody)(scope));

      // If infinite scrolling enabled
      if (infinite) {
        // Get initial limit and offset
        var offsetKey = 'e50OffsetKey' in attrs ? attrs.e50OffsetKey : 'offset';
        var limitKey = 'e50LimitKey' in attrs ? attrs.e50LimitKey : 'limit';
        var offset = params && offsetKey in params ? params.offset : body.offset;
        var limit = params && limitKey in params ? params.limit : body.limit;
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
        params = $parse(attrs.e50FetchParams)(scope);
        body = $parse(attrs.e50FetchBody)(scope);
        var append = false;
        if (infinite) {
          var oObj = (params && offsetKey in params) ? params : body;
          var lObj = (params && limitKey in params) ? params : body;
          // If it's a non-polling infinite scroll, fetch the next several rows
          if (isScroll && !polling) {
            oObj.offset = offset;
            append = true;
          // If it's a polling poll or scroll, fetch all with the increased limit
          } else if (polling && (isPoll || isScroll)) {
            lObj.limit = limit;
          // Otherwise, reset everything because some other parameter has changed
          } else {
            offset = oObj.offset;
            limit = lObj.limit;
          }
        }
        if ('e50Loading' in attrs && !isPoll) {
          if (attrs.e50Loading !== 'emit') { scope.$broadcast('loading-show', 'e50-table-loading'); }
          if (attrs.e50Loading !== 'broadcast') { scope.$emit('loading-show', 'e50-table-loading'); }
        }
        if ('e50InfiniteLoading' in attrs && isScroll) {
          if (attrs.e50InfiniteLoading !== 'emit') { scope.$broadcast('loading-show', 'e50-table-infinite-loading'); }
          if (attrs.e50InfiniteLoading !== 'broadcast') { scope.$emit('loading-show', 'e50-table-infinite-loading'); }
        }
        return fetchResource.fetch(params,body).$promise.then(function(response) {
          // If the data has changed
          if (!angular.equals(scope.e50GetData(),response.data)) {
            // If appending
            if (append) {
              var args = response.data;
              var array = scope.e50GetData();
              if ('e50DataProp' in attrs) {
                args = args[attrs.e50DataProp];
                array = array[attrs.e50DataProp];
              }
              Array.prototype.push.apply(array, args);
            // If replacing
            } else {
              scope.e50SetData(response.data);
            }
            if (infinite) { infiniteScroll(); }
          }
        }).finally(function() {
          fetching = false;
          if ('e50Loading' in attrs && !isPoll) {
            if (attrs.e50Loading !== 'emit') { scope.$broadcast('loading-hide', 'e50-table-loading'); }
            if (attrs.e50Loading !== 'broadcast') { scope.$emit('loading-hide', 'e50-table-loading'); }
          }
          if ('e50InfiniteLoading' in attrs && isScroll) {
            if (attrs.e50InfiniteLoading !== 'emit') { scope.$broadcast('loading-hide', 'e50-table-infinite-loading'); }
            if (attrs.e50InfiniteLoading !== 'broadcast') { scope.$emit('loading-hide', 'e50-table-infinite-loading'); }
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
        }, function() {
          fetch();
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
      function infiniteScroll() {
        // Find the scrolling parent element
        var scrollParent = scrollParentFn(element);
        scrollParent.on('scroll', function() {
          var lasts = element[0].querySelectorAll('[e50-table-row]:last-child');
          angular.forEach(lasts, function(last) {
            if (last.offsetHeight && last.offsetTop < scrollParent[0].scrollTop +
                scrollParent[0].offsetHeight && !fetching) {
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

      /**
       * Determines the first scrollable parent of an element
       *
       * jQLite implementation, adapted from slindberg/jquery-scrollparent
       */
      function scrollParentFn(elem) {
        var position = elem.css('position');
        var excludeStaticParent = position === 'absolute';
        var parent;
        for (parent = elem.parent(); parent; parent = parent.parent()) {
          if (excludeStaticParent && parent.css('position') === 'static') {
            continue;
          }
          if ((/(auto|scroll)/).test(parent.css('overflow') +
                parent.css('overflow-y') + parent.css('overflow-x'))) {
            break;
          }
        }
        return position === 'fixed' || !parent ? angular.element(elem[0].ownerDocument || document) : parent;
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
    link: function (scope, element, attrs, ctrl) {

      var show = attrs.e50IfData !== 'false';
      var replace = attrs.e50IfNoData ? attrs.e50IfNoData : null;
      var $none = angular.element('<div class="e50-no-data">'+replace+'</div>');

      // Hide & show the element based on data status
      scope.$watchCollection('e50GetData()', function(v) {
        var data = 'e50DataProp' in ctrl.$attrs ? v[ctrl.$attrs.e50DataProp] : v;
        if (typeof data !== 'undefined' && (data.length && show || !(data.length || show))) {
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
        rpt.value = key + ' in e50GetData()' + prop + ' | orderBy : e50Sort : e50SortReverse | filter : e50Filter';
        row.attributes.setNamedItem(rpt);
      });

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

angular.module('e50Table').directive('e50View', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs, ctrl) {

      // Hide & show the element based on current view
      ctrl.$attrs.$observe('e50Views', function(v) {
        if (v === attrs.e50View) {
          element.removeClass('ng-hide');
        } else {
          element.addClass('ng-hide');
        }
      });

    }
  };
});

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
