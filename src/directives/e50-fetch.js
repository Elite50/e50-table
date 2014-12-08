angular.module('e50Table').directive('e50Fetch', function ($parse, $resource, Poll) {
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
            if (append) {
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
});
