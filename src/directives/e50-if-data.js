angular.module('e50Table').directive('e50IfData', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs, ctrl) {

      var show = attrs.e50IfData !== 'false';
      var replace = attrs.e50IfNoData ? attrs.e50IfNoData : null;
      var $none = angular.element('<div class="e50-no-data">'+replace+'</div>');

      // Hide & show the element based on data status
      scope.$watchCollection('e50GetData()', function(v) {
        var data = 'e50DataProp' in ctrl.$attrs ? v[ctrl.$attrs.e50DataProp] : v;
        if (typeof data !== 'undefined' && (data.length && show || !(data.length || show))) {
          if (replace) {
            $none.remove();
          }
          element.removeClass('ng-hide');
        } else {
          if (replace) {
            element.parent()[0].insertBefore($none[0], element[0]);
          }
          element.addClass('ng-hide');
        }
      });

    }
  };
});
