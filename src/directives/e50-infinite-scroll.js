angular.module('e50Table').directive('e50InfiniteScroll', function ($parse) {
  return {
    restrict: 'A',
    require: 'e50Table',
    link: function(scope, element, attrs) {

      var scrollParent = false;
      var scrollNum = 0;

      // Set up infinite scroll event
      scope.e50InfiniteScroll = function(redraw) {
        var currentNum = scrollNum;
        // Find the scrolling parent element
        if (!scrollParent || redraw) {
          scrollParent = scrollParentFn(element);
        }
        scrollParent.off('scroll.e50Table');
        scrollParent.on('scroll.e50Table', function() {
          var attrValue = attrs.e50Table ? '=' + attrs.e50Table : '';
          var lasts = element[0].querySelectorAll('[e50-table-row' + attrValue + ']:last-child');
          angular.forEach(lasts, function(last) {
            if (currentNum === scrollNum &&
                last.offsetHeight &&
                last.offsetTop + last.offsetHeight < scrollParent[0].scrollTop + scrollParent[0].offsetHeight + 200) {
              // Don't fire event more than once per scroll
              scrollNum++;
              // Only fetch if not currently fetching
              if (!scope.e50FetchCount) {
                scope.$broadcast('e50-infinite-scroll');
              } else if (!attrs.e50InfiniteScroll) {
                // Only reattach scroll listener if not handling it manually
                scope.e50InfiniteScroll();
              }
              // Call custom function with callback to rewatch for infinite scroll
              if (attrs.e50InfiniteScroll) {
                $parse(attrs.e50InfiniteScroll)(scope)(function(redraw) {
                  scope.e50InfiniteScroll(redraw);
                });
              }
            }
          });
        });
      };
      scope.e50InfiniteScroll();

      /**
       * Determines the first scrollable parent of an element
       *
       * jQLite implementation, adapted from slindberg/jquery-scrollparent
       */
      function scrollParentFn(elem) {
        var position = elem.css('position');
        var excludeStaticParent = position === 'absolute';
        var parentElem;
        for (parentElem = elem.parent(); parentElem[0]; parentElem = parentElem.parent()) {
          if (excludeStaticParent && parentElem.css('position') === 'static') {
            continue;
          }
          if ((/(auto|scroll)/).test(parentElem.css('overflow') +
                parentElem.css('overflow-y') + parentElem.css('overflow-x'))) {
            break;
          }
        }
        return position === 'fixed' || !parentElem ? angular.element(elem[0].ownerDocument || document) : parentElem;
      }

    }
  };
});
