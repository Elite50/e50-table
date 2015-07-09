angular.module('e50Table').directive('e50DragHandle', function () {
  return {
    restrict: 'A',
    require: '^e50Drag',
    link: function postLink(scope, element, attrs, ctrl) {

      var $drag, diffTop, diffLeft, iTop, iLeft;

      element.on('mousedown', function(event) {
        iTop = ctrl.$element[0].getBoundingClientRect().top;
        iLeft = ctrl.$element[0].getBoundingClientRect().left;
        diffTop = event.clientY - iTop;
        diffLeft = event.clientX - iLeft;
        ctrl.$element.css({
          opacity: 0.2
        });
        $drag = angular.element('<div></div>').css({
          position: 'absolute',
          width: ctrl.$element[0].clientWidth,
          height: ctrl.$element[0].clientHeight,
          top: iTop,
          left: iLeft,
          border: '2px dashed #999',
          zIndex: 10000000
        });
        angular.element('body').append($drag).css({
          userSelect: 'none'
        }).on('mouseleave mousemove', function(event) {
          $drag.css({
            top: 'e50DragX' in ctrl.$attrs ?
              gravity(iTop, event.clientY - diffTop) : event.clientY - diffTop,
            left: 'e50DragY' in ctrl.$attrs ?
              gravity(iLeft, event.clientX - diffLeft) : event.clientX - diffLeft
          });
        }).on('mouseup', function() {
          $drag.remove();
          ctrl.$element.css({
            opacity: 1
          });
          angular.element('body').css({
            userSelect: ''
          }).off('mousemove');
        });
      });

      function gravity(earth, moon) {
        if ('e50DragGravity' in ctrl.$attrs) {
          var r = ctrl.$attrs.e50DragGravity || 0;
          var dist = Math.abs(moon - earth);
          var pull = dist > r ? Math.round(Math.sqrt(dist - r)) + r : dist;
          return earth + (earth < moon ? 1 : -1) * pull;
        } else {
          return earth;
        }
      }

    }
  };
});
