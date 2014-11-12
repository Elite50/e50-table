angular.module('e50Table').directive('e50TableRow', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function postLink(scope, element, attrs, ctrl) {

      // Possibly add hover class for mousing over rows
      if ('e50Hover' in attrs) {
        var hoverClass = attrs.e50Hover ? attrs.e50Hover : 'hover';
        element.on('mouseenter', function() {
          element.addClass(hoverClass);
        }).on('mouseleave', function() {
          element.removeClass(hoverClass);
        });
      }

    }
  };
});
