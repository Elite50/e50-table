angular.module('demo', ['e50Table']);

angular.module('demo').controller('demoCtrl', function($scope) {
  $scope.people = [
    {
      id: 1,
      name: 'John Doe',
      address: '815 Ocean Drive'
    },
    {
      id: 2,
      name: 'Jane Doe',
      address: '42 Hatch Road'
    }
  ];

  $scope.hi = function() {
    alert('hi');
  };
  $scope.bye = function() {
    alert('bye');
  };
});
