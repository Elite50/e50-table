angular.module('e50Table').directive('e50View', function ($timeout) {
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
});
