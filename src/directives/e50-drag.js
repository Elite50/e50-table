angular.module('e50Table').directive('e50Drag', function () {
  return {
    restrict: 'A',
    controller: function($element, $attrs) {
      this.$element = $element;
      this.$attrs = $attrs;
    },
    link: function postLink() {

    }
  };
});
