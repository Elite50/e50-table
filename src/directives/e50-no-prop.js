angular.module('e50Table').directive('e50NoProp', function () {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      element.on('click', function(e) {
        e.stopPropagation();
      });
    }
  };
});
