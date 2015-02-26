angular.module('e50Table').directive('e50View', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs, ctrl) {

      // Hide & show the element based on current view
      ctrl.$attrs.$observe('e50Views', function(v) {
        if (v === attrs.e50View) {
          element.removeClass('ng-hide');
          scope.e50InfiniteScroll(true);
        } else {
          element.addClass('ng-hide');
        }
      });

    }
  };
});
