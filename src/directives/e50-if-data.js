angular.module('e50Table').directive('e50IfData', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs, ctrl) {

      var show = attrs.e50IfData !== 'false';
      var replace = attrs.e50IfNoData ? attrs.e50IfNoData : null;
      var $none = angular.element('<div class="e50-no-data">'+replace+'</div>');
      var loading = 'e50IfLoadingData' in attrs ?
        (attrs.e50IfLoadingData.length ? attrs.e50IfLoadingData : 'Loading data') : null;
      var $noneL = angular.element('<div class="e50-no-data">'+loading+'</div>');

      function allDeleted(data) {
        for (var i = 0; i < data.length; i++) {
          if (scope.e50Deleted.indexOf(data[i].id) === -1) {
            return false;
          }
        }
        return true;
      }

      // Hide & show the element based on data status
      scope.$watch('e50GetData()', function(v) {
        var data = 'e50DataProp' in ctrl.$attrs ? v[ctrl.$attrs.e50DataProp] : v;

        // If nothing has ever been successfully fetched
        if (typeof data === 'undefined') {
          if (loading) {
            element.parent()[0].insertBefore($noneL[0], element[0]);
          }
          $none.remove();
          if (show) {
            element.addClass('ng-hide');
          } else {
            element.removeClass('ng-hide');
          }

        // If the data is empty
        } else if (!data.length || allDeleted(data)) {
          if (replace) {
            element.parent()[0].insertBefore($none[0], element[0]);
          }
          $noneL.remove();
          if (show) {
            element.addClass('ng-hide');
          } else {
            element.removeClass('ng-hide');
          }

        // If data is fine and dandy
        } else {
          $none.remove();
          $noneL.remove();
          if (show) {
            element.removeClass('ng-hide');
          } else {
            element.addClass('ng-hide');
          }
        }
      }, true);

    }
  };
});
