angular.module('e50Table').directive('e50Drag', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function postLink(scope, element, attrs, ctrl) {

      var $drag, diffTop, diffLeft, iTop, iLeft, rowMap, index;

      // Start dragging the row
      scope.e50StartDrag = function(event) {
        iTop = element[0].getBoundingClientRect().top;
        iLeft = element[0].getBoundingClientRect().left;
        diffTop = event.clientY - iTop;
        diffLeft = event.clientX - iLeft;

        // Get row map and current row index
        rowMap = getRowMap();
        index = getRowIndex();

        // Set the underlying element style
        element.addClass('e50-dragging');

        // Create the dragging border element
        $drag = angular.element('<div></div>').css({
          position: 'absolute',
          width: element[0].clientWidth,
          height: element[0].clientHeight,
          top: iTop,
          left: iLeft,
          border: '2px dashed #999',
          zIndex: 10000000,
          cursor: 'move'
        });

        // Add events for moving and stopping
        angular.element('body').append($drag).css({
          userSelect: 'none'

        }).on('mousemove', function(event) {
          // Determine where the thing is dragged
          var cTop = 'e50DragX' in attrs ?
              gravity(iTop, event.clientY - diffTop) : event.clientY - diffTop;
          var cLeft = 'e50DragY' in attrs ?
              gravity(iLeft, event.clientX - diffLeft) : event.clientX - diffLeft;
          $drag.css({ top: cTop, left: cLeft });
          // Determine where to drop it
          moveRow(cTop, cLeft);

        }).on('mouseup', function() {
          $drag.remove();
          element.removeClass('e50-dragging');
          angular.element('body').css({
            userSelect: ''
          }).off('mouseup mousemove');
        });
      };

      // Get a map of all row positions in the table
      function getRowMap() {
        var rows = ctrl.$element[0].querySelectorAll('[e50-table-row]');
        var map = [];
        angular.forEach(rows, function(row) {
          map.push({
            top: row.getBoundingClientRect().top,
            left: row.getBoundingClientRect().left
          });
        });
        return map;
      }

      // Get the index of the current row
      function getRowIndex() {
        var key = 'e50DataKey' in ctrl.$attrs ? ctrl.$attrs.e50DataKey : 't';
        scope[key].$$e50FindRow = true;
        for (var i = 0; i < scope.e50FilteredData.length; i++) {
          if (scope.e50FilteredData[i].$$e50FindRow) {
            delete scope[key].$$e50FindRow;
            return i;
          }
        }
      }

      // Optional effect that makes restricting by x or y have 'gravity'
      function gravity(earth, moon) {
        if ('e50DragGravity' in attrs) {
          var r = attrs.e50DragGravity || 0;
          var dist = Math.abs(moon - earth);
          var pull = dist > r ? Math.round(Math.sqrt(dist - r)) + r : dist;
          return earth + (earth < moon ? 1 : -1) * pull;
        } else {
          return earth;
        }
      }

      // Find the closest row location and drop the dragged item
      function moveRow(cTop, cLeft) {
        var closestDist = Number.MAX_VALUE;
        var closestIndex;
        // Find the closest dropzone
        angular.forEach(rowMap, function(row, r) {
          var dTop = row.top - cTop;
          var dLeft = row.left - cLeft;
          var dist = Math.sqrt(dTop*dTop + dLeft*dLeft);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = r;
          }
        });
        // Reorder the list and recalculate map
        if (index !== closestIndex) {
          scope.e50MoveData(index, closestIndex);
          index = closestIndex;
          rowMap = getRowMap();
        }
      }

    }
  };
});
