angular.module('demo', ['e50Table']);

angular.module('demo').controller('demoCtrl', function($scope) {
  $scope.people = [
    {
      id: 1,
      name: 'John Doe',
      address: '815 Ocean Drive',
      actions: 14
    },
    {
      id: 2,
      name: 'Jane Doe',
      address: '42 Hatch Road',
      actions: 51
    }
  ];

  $scope.hi = function() {
    alert('hi');
  };
  $scope.bye = function() {
    alert('bye');
  };
});
