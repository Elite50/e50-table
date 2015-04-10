angular.module('e50Table').directive('e50Hover', function ($parse) {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {

      // Add hover class for mousing over rows
      var hoverClass = attrs.e50Hover ? attrs.e50Hover : 'hover';
      element.on('mouseenter', function() {
        if (!('e50HoverIf' in attrs) || $parse(attrs.e50HoverIf)(scope)) {
          element.addClass(hoverClass);
        }
      }).on('mouseleave', function() {
        element.removeClass(hoverClass);
      });

    }
  };
});
