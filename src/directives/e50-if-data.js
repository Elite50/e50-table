angular.module('e50Table').directive('e50IfData', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs) {

      var show = attrs.e50IfData !== 'false';
      var replace = attrs.e50IfNoData ? attrs.e50IfNoData : null;
      var $none = angular.element('<div class="e50-no-data">'+replace+'</div>');
      var loading = 'e50IfLoadingData' in attrs ?
        (attrs.e50IfLoadingData.length ? attrs.e50IfLoadingData : 'Loading data') : null;
      var $noneL = angular.element('<div class="e50-no-data">'+loading+'</div>');

      // Hide & show the element based on data status
      scope.$watchCollection('e50FilteredData', function(data) {

        // If nothing has ever been successfully fetched
        if (typeof data === 'undefined') {
          if (loading) {
            element.parent()[0].insertBefore($noneL[0], element[0]);
          }
          $none.remove();
          if (show) {
            element.css('display', 'none');
          } else {
            element.css('display', '');
          }

        // If the data is empty
        } else if (!data.length) {
          if (replace) {
            element.parent()[0].insertBefore($none[0], element[0]);
          }
          $noneL.remove();
          if (show) {
            element.css('display', 'none');
          } else {
            element.css('display', '');
          }

        // If data is fine and dandy
        } else {
          $none.remove();
          $noneL.remove();
          if (show) {
            element.css('display', '');
          } else {
            element.css('display', 'none');
          }
        }
      });

    }
  };
});
