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
        params = $parse(attrs.e50FetchParams)(scope);
        body = $parse(attrs.e50FetchBody)(scope);
        var append = false;
        console.log(isPoll ? 'Polling' : isScroll ? 'Scrolling' : 'Fetching');
        if (infinite) {
          var oObj = (params && offsetKey in params) ? params : body;
          var lObj = (params && limitKey in params) ? params : body;
          if (isScroll && !polling) {
            oObj.offset = offset;
            append = true;
          } else if (polling && (isPoll || isScroll)) {
            lObj.limit = limit;
          } else {
            offset = oObj.offset;
            limit = lObj.limit;
          }
        }
        if ('e50Loading' in attrs && !isPoll) {
          var message = isScroll ? 'e50-table-infinite-loading' : 'e50-table-loading';
          if (attrs.e50Loading !== 'emit') {
            scope.$broadcast('loading-show', message);
          }
          if (attrs.e50Loading !== 'broadcast') {
            scope.$emit('loading-show', message);
          }
        }
        return fetchResource.fetch(params,body).$promise.then(function(response) {
          // If the data has changed
          if (!angular.equals(scope.e50GetData(),response.data)) {
            console.log('Data has changed!');
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
          infiniteLoading = false;
        }).finally(function() {
          if ('e50Loading' in attrs && !isPoll) {
            var message = isScroll ? 'e50-table-infinite-loading' : 'e50-table-loading';
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
        }, function() {
          fetch();
        }, true);
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
              fetch(false, true);
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
