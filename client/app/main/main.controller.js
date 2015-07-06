'use strict';

angular.module('stocksApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];
    $scope.warning = null;

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      $scope.gotThings();
      socket.syncUpdates('thing', $scope.awesomeThings, $scope.gotThings);
    });

    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }

      $scope.warning = null;
      $scope.newThing = $scope.newThing;

      for (var i=0; i<$scope.awesomeThings.length; i+=1) {
        if ($scope.awesomeThings[i].name === $scope.newThing.toUpperCase()) {
          $scope.warning = 'Symbol already exists!';
          return;
        }
      }

      $http.post('/api/things', { name: $scope.newThing.toUpperCase() });
      $scope.newThing = '';
    };

    $scope.deleteThing = function(thing) {
      if ($scope.awesomeThings.length > 1) {
        $scope.warning = null;
        $http.delete('/api/things/' + thing._id);
        return;
      }
      $scope.warning = 'Must leave at least 1 symbol.';
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });

    $scope.gotThings = function() {
        var seriesOptions = [],
            seriesCounter = 0,
            names = $scope.awesomeThings.map(function(awesomeThing) {
              return awesomeThing.name;
            }),

            // create the chart when all data is loaded
            createChart = function () {

                $('#container').highcharts('StockChart', {

                    navigator: {
                        enabled: false
                    },

                    scrollbar: {
                        enabled: false
                    },

                    rangeSelector: {
                        selected: 4
                    },

                    yAxis: {
                        labels: {
                            formatter: function () {
                                return (this.value > 0 ? ' + ' : '') + this.value + '%';
                            }
                        },
                        plotLines: [{
                            value: 0,
                            width: 2,
                            color: 'silver'
                        }]
                    },

                    plotOptions: {
                        series: {
                            compare: 'percent'
                        }
                    },

                    tooltip: {
                        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
                        valueDecimals: 2
                    },

                    series: seriesOptions
                });
            };

        $.each(names, function (i, name) {

            $.getJSON('http://www.highcharts.com/samples/data/jsonp.php?filename=' + name.toLowerCase() + '-c.json&callback=?',    function (data) {

                seriesOptions[i] = {
                    name: name,
                    data: data
                };

                // As we're loading the data asynchronously, we don't know what order it will arrive. So
                // we keep a counter and create the chart when all the data is loaded.
                seriesCounter += 1;

                if (seriesCounter === names.length) {
                    createChart();
                }
            });
        });
    }
  });
