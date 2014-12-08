'use strict';
angular.module('e50Table', ['ngResource']);

angular.module('e50Table').directive('e50Fetch', ["$parse", "$resource", "Poll", function ($parse, $resource, Poll) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      var polling = 'e50Poll' in attrs;
      var infinite = 'e50InfiniteScroll' in attrs;
      var infiniteLoading = false;

      // Get initial params and body
      var params = angular.copy($parse(attrs.e50FetchParams)(scope));
      var body = angular.copy($parse(attrs.e50FetchBody)(scope));

      // If infinite scrolling enabled
      if (infinite) {
        // Get initial limit and offset
        var offsetKey = 'e50OffsetKey' in attrs ? attrs.e50OffsetKey : 'offset';
        var limitKey = 'e50LimitKey' in attrs ? attrs.e50LimitKey : 'limit';
        var offset = params && offsetKey in params ? params.offset : body.offset;
        var offsetPrev = offset;
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
      function fetch(poll) {
        params = angular.copy($parse(attrs.e50FetchParams)(scope));
        body = angular.copy($parse(attrs.e50FetchBody)(scope));
        var append = false;
        if (infinite) {
          if (!polling) {
            var obj = (params && offsetKey in params) ? params : body;
            if (offsetPrev !== offset) {
              // If scrolling, update offset
              obj.offset = offset;
              offsetPrev = offset;
              append = true;
            } else {
              // Something else changed, reset offset
              offset = obj.offset;
            }
          } else {
            // If polling and scrolling, update limit
            var objL = (params && limitKey in params) ? params : body;
            objL.limit = limit;
            append = 'fake';
          }
        }
        if ('e50Loading' in attrs && !poll) {
          var message = append ? 'e50-table-infinite-loading' : 'e50-table-loading';
          if (attrs.e50Loading !== 'emit') {
            scope.$broadcast('loading-show', message);
          }
          if (attrs.e50Loading !== 'broadcast') {
            scope.$emit('loading-show', message);
          }
        }
        return fetchResource.fetch(params,body).$promise.then(function(response) {
          if (!angular.equals(scope.e50GetData(),response.data)) {
            if (append === true) {
              // If appending
              var args, array;
              if ('e50DataProp' in attrs) {
                args = response.data[attrs.e50DataProp];
                array = scope.e50GetData()[attrs.e50DataProp];
              } else {
                args = response.data;
                array = scope.e50GetData();
              }
              Array.prototype.push.apply(array, args);
            } else {
              // If replacing
              scope.e50SetData(response.data);
            }
            if (infinite) { infiniteScroll(); }
          }
          infiniteLoading = false;
        }).finally(function() {
          if ('e50Loading' in attrs && !poll) {
            var message = append ? 'e50-table-infinite-loading' : 'e50-table-loading';
            if (attrs.e50Loading !== 'emit') {
              scope.$broadcast('loading-hide', message);
            }
            if (attrs.e50Loading !== 'broadcast') {
              scope.$emit('loading-hide', message);
            }
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
                scrollParent[0].offsetHeight && !infiniteLoading) {
              if (polling) {
                // Infinite scroll handled differently when polling
                limit += initialLimit;
              } else {
                offset += limit;
              }
              fetch();
              infiniteLoading = true;
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
