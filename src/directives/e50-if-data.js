angular.module('e50Table').directive('e50IfData', function () {
  return {
    restrict: 'A',
    require: '^e50Table',
    link: function (scope, element, attrs) {
      var show = attrs.e50IfData !== 'false';
      var replace;
      var $none;
      var loading;
      var $noneL;

      /**
       * Create or update the no-data element
       */
      function updateNoDataElement() {
        replace = attrs.e50IfNoData ? attrs.e50IfNoData : null;

        if ($none) {
          $none.text(replace);
        } else {
          $none = angular.element('<div class="e50-no-data">' + replace + '</div>');
        }
      }

      /**
       * Create or update the loading-data element
       */
      function updateLoadingDataElement() {
        loading = null;

        if ('e50IfLoadingData' in attrs) {
          loading = attrs.e50IfLoadingData.length ? attrs.e50IfLoadingData : 'Loading data';
        }

        if ($noneL) {
          $noneL.text(loading);
        } else {
          $noneL = angular.element('<div class="e50-no-data">' + loading + '</div>');
        }
      }

      // Create initial elements
      updateNoDataElement();
      updateLoadingDataElement();

      // Watch for changes to the no-data attr and update element
      scope.$watch(function() {
        return attrs.e50IfNoData
      }, updateNoDataElement);

      // WAtch for changes to the loading-data attr and update element
      scope.$watch(function() {
        return attrs.e50IfLoadingData;
      }, updateLoadingDataElement);

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
