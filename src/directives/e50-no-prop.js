angular.module('e50Table').directive('e50NoProp', function () {
  return {
    restrict: 'A',
    link: function postLink(scope, element) {

      function stopProp(e) {
        e.stopPropagation();
      }

      element.on('click', stopProp);
      element.on('mousedown', stopProp);

    }
  };
});
