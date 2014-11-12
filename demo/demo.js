angular.module('demo', ['e50Table']);

angular.module('demo').controller('demoCtrl', function($interval, $scope) {
  $scope.people = [
    {
      id: 1,
      name: 'John Doe',
      address: '815 Ocean Drive',
      count: 14
    },
    {
      id: 2,
      name: 'Jane Doe',
      address: '42 Hatch Road',
      count: 51
    }
  ];

  $scope.hi = function() {
    alert('hi');
  };
  $scope.bye = function() {
    alert('bye');
  };

  var names = [
    'Carol', 'Susan', 'Trent', 'Brent', 'Faith', 'Larry', 'Theresa',
    'Lars', 'Carmen', 'Brenna', 'Calvin', 'Karl', 'Carl', 'Smith',
    'Tim', 'Fred', 'Trisha', 'Lorraine', 'Greta', 'Trish', 'Mary',
    'Margaret', 'Marguerite', 'Mark', 'Marc', 'Jimmy', 'James', 'Fred',
    'Frank', 'Francis', 'Peter', 'Patrick', 'Patricia', 'Pamela'
  ];
  var vs = ['a', 'e', 'i', 'o', 'u'];
  var cs = [
    'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n',
    'p', 'r', 's', 't', 'v', 'w'
  ];
  var streets = [
    'Street', 'Road', 'Lane', 'Boulevard', 'Circle', 'Place', 'Avenue'
  ];

  function rand(m) {
    return Math.floor(Math.random()*m);
  }

  $interval(function() {
    if ($scope.people.length < 10) {
      var fn = names[rand(names.length)];
      var ln = names[rand(names.length)] + 'son';
      var csl = cs.length; var vsl = vs.length;
      var street = cs[rand(csl)].toUpperCase() + vs[rand(vsl)] + vs[rand(vsl)];
      street += cs[rand(csl)] + vs[rand(vsl)] + cs[rand(csl)];
      $scope.people.push({
        id: $scope.people.length,
        name: fn + ' ' + ln,
        address: rand(2000) + ' ' + street + ' ' + streets[rand(streets.length)],
        count: rand(100)
      });
    } else {
      $scope.people = [];
    }
  }, 3000);
});
