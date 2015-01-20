angular.module('e50Table').directive('e50Fetch', function ($parse, $resource, Poll, $timeout) {
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
        params = angular.copy($parse(attrs.e50FetchParams)(scope));
        body = angular.copy($parse(attrs.e50FetchBody)(scope));
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
        if ('e50Loading' in attrs && !isPoll && !isScroll && hasFetched) {
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
            if (infinite) { $timeout(infiniteScroll); }
          } else if (isScroll) {
            hasMore = false;
          }
        }).finally(function() {
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
      function infiniteScroll() {
        // Find the scrolling parent element
        if (!scrollParent) {
          scrollParent = scrollParentFn(element);
        }
        scrollParent.off('scroll');
        scrollParent.on('scroll', function() {
          var lasts = element[0].querySelectorAll('[e50-table-row]:last-child');
          angular.forEach(lasts, function(last) {
            if (last.offsetHeight && last.offsetTop < scrollParent[0].scrollTop +
                scrollParent[0].offsetHeight + last.offsetHeight && !fetching && hasMore) {
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
      if (infinite) { infiniteScroll(); }

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
});
