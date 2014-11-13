angular.module('e50Table').directive('e50Hover', function () {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {

      // Add hover class for mousing over rows
      var hoverClass = attrs.e50Hover ? attrs.e50Hover : 'hover';
      element.on('mouseenter', function() {
        element.addClass(hoverClass);
      }).on('mouseleave', function() {
        element.removeClass(hoverClass);
      });

    }
  };
});
