angular.module('e50Table').directive('e50DragHandle', function () {
  return {
    restrict: 'A',
    require: '^e50Drag',
    link: function postLink(scope, element, attrs, ctrl) {

      var $drag, diffTop, diffLeft;

      element.on('mousedown', function(event) {
        var dragTop = ctrl.$element[0].getBoundingClientRect().top;
        var dragLeft = ctrl.$element[0].getBoundingClientRect().left;
        diffTop = event.clientY - dragTop;
        diffLeft = event.clientX - dragLeft;
        ctrl.$element.css({
          opacity: 0.2
        });
        $drag = angular.element('<div></div>').css({
          position: 'absolute',
          width: ctrl.$element[0].clientWidth,
          height: ctrl.$element[0].clientHeight,
          top: dragTop,
          left: dragLeft,
          border: '2px dashed #999',
          zIndex: 10000000
        });
        angular.element('body').append($drag).css({
          userSelect: 'none'
        }).on('mouseleave mousemove', function(event) {
          var css = {};
          if (!('e50DragX' in ctrl.$attrs)) {
            css.top = event.clientY - diffTop;
          }
          if (!('e50DragY' in ctrl.$attrs)) {
            css.left = event.clientX - diffLeft;
          }
          $drag.css(css);
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

    }
  };
});
