angular.module('e50Table').directive('e50Fetch', function ($parse, $resource, E50Poll, $timeout) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      var hasMore = true;
      var polling = 'e50Poll' in attrs;
      var infinite = 'e50InfiniteScroll' in attrs;
      var hasFetched = false;
      var fetchNum = 0;

      // Keep track of pending requests
      scope.e50FetchCount = 0;

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
      function fetchResource() {
        return $resource(attrs.e50Fetch, {}, {
          fetch: {
            method: 'e50FetchMethod' in attrs ? attrs.e50FetchMethod : 'GET'
          }
        });
      }

      // Fetch the table data
      function fetch(isPoll, isScroll) {
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
          scope.e50FetchCount++;
        }
        var promise = fetchResource().fetch(params,body).$promise.then(
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
          hasFetched = true;
          if (!isPoll) {
            scope.e50FetchCount--;
          }
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

      /**
       * Determine if any of the given fetch params have changed
       *
       * @param {object} newParams
       * @param {object} oldParams
       * @param {array} params
       *
       * @return {bool}
       */
      function paramsHaveChanged(newParams, oldParams, params) {
        var changed = false;
        _.forEach(params, function(param) {
          if (newParams && oldParams && !_.isEqual(newParams[param], oldParams[param])) {
            changed = true;
          }
        });
        return changed;
      }

      // Only fetch once if desired
      if ('e50FetchOnce' in attrs) {
        fetch();

      // Otherwise fetch regularly
      } else {
        scope.$watch(function() {
          return [
            $parse(attrs.e50FetchParams)(scope),
            $parse(attrs.e50FetchBody)(scope),
            attrs.e50Fetch,
            attrs.e50FetchMethod
          ];
        }, function(newValues, oldValues) {
          // Fetch only if we have done the initial fetch, or
          // if the fetch url or method has changed, or
          // if fetch parameters change and we are over the fetch limit
          // (ie: if we are under limit, sorting/filtering should be done client side)
          if (!hasFetched ||
              (newValues[2] !== oldValues[2] || newValues[3] !== newValues[3]) ||
              !(
                'e50FetchLimit' in attrs &&
                'e50FetchLimitProp' in attrs &&
                scope.e50GetData()[attrs.e50FetchLimitProp] <= attrs.e50FetchLimit &&
                !(
                  'e50FetchLimitUnless' in attrs &&
                  (paramsHaveChanged(newValues[0], oldValues[0], $parse(attrs.e50FetchLimitUnless)(scope)) ||
                   paramsHaveChanged(newValues[1], oldValues[1], $parse(attrs.e50FetchLimitUnless)(scope)))
                )
              )
          ) {
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
        // If there's more to get
        if (hasMore) {
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
