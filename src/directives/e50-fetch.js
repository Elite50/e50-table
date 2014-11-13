angular.module('e50Table').directive('e50Fetch', function ($parse, $resource, Poll) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      // Define the resource to fetch from
      var fetchResource = $resource(attrs.e50Fetch, {}, {
        fetch: {
          method: 'e50FetchMethod' in attrs ? attrs.e50FetchMethod : 'GET'
        }
      });

      // Fetch the table data
      function fetch() {
        return fetchResource.fetch(
          $parse(attrs.e50FetchParams)(scope),
          $parse(attrs.e50FetchBody)(scope)
        ).$promise.then(function(response) {
          scope.e50SetData(response.data);
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
      if ('e50Poll' in attrs) {
        var poll = new Poll(fetch, attrs.e50Poll);
        scope.$on('$destroy', function() {
          poll.stop();
        });
      }

    }
  };
});
