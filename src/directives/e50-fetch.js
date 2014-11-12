angular.module('e50Table').directive('e50Fetch', function ($resource, Poll) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function postLink(scope, element, attrs, ctrl) {

      // Define the resource to fetch from
      var fetchResource = $resource(attrs.e50Fetch, {}, {
        fetch: {
          method: 'e50FetchMethod' in attrs ? attrs.e50FetchMethod : 'GET'
        }
      });

      // Fetch the table data
      function fetch() {
        return fetchResource.fetch(
          ctrl.$scope.fetchParams,
          ctrl.$scope.fetchBody
        ).$promise.then(function(response) {
          ctrl.$scope.data = response.data;
        });
      }

      // Only fetch once if desired
      if ('e50FetchOnce' in attrs) {
        fetch();
      // Otherwise, fetch whenever the params change
      } else {
        ctrl.$scope.$watch('[fetchParams, fetchBody]', fetch, true);
      }

      // Start polling if element has poll attr
      if ('e50Poll' in attrs) {
        var poll = new Poll(fetch, attrs.e50Poll);
        ctrl.$scope.$on('$destroy', function() {
          poll.stop();
        });
      }

    }
  };
});
