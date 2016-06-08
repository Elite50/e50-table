angular.module('e50Table').directive('e50DragHandle', function ($parse) {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {

      /**
       * Add drag handling
       */
      function addHandle() {
        // Change handle cursor
        element.css({
          cursor: 'move'
        });
        // Prevent browser dragging
        element.on('dragstart.e50Table', function() {
          return false;
        });
        // Listen for the start of dragging
        element.on('mousedown.e50Table', function(event) {
          scope.e50StartDrag(event);
          event.stopPropagation();
        });
      }

      /**
       * Remove drag handling
       */
      function removeHandle() {
        // Reset handle cursor
        element.css({
          cursor: ''
        });
        // Reenable browser dragging
        element.off('dragstart.e50Table');
        // Remove drag listener
        element.off('mousedown.e50Table');
      }

      if (!attrs.e50DragHandle) {
        // If no conditional
        addHandle();
      } else {
        // If handle is dynamic
        scope.$watch(function() {
          return $parse(attrs.e50DragHandle)(scope);
        }, function(v) {
          if (v) {
            addHandle();
          } else {
            removeHandle();
          }
        });
      }

    }
  };
});
