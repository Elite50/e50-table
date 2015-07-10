angular.module('e50Table').directive('e50DragHandle', function () {
  return {
    restrict: 'A',
    link: function postLink(scope, element) {

      // Add appropriate styles to handle
      element.css({
        cursor: 'move'
      });

      // Listen for the start of dragging
      element.on('mousedown', function(event) {
        scope.e50StartDrag(event);
      });

    }
  };
});
