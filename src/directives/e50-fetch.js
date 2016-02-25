angular.module('e50Table').directive('e50Fetch', function ($parse, $resource, E50Poll, $timeout) {
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
});
