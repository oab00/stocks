'use strict';

angular.module('stocksApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];
    $scope.warning = null;
    $scope.connectedUsers = 0;
    $scope.spinLoad = false; // TODO: load spinner

    socket.socket.on('connectedUsers', function(connectedUsers) {
      $scope.connectedUsers = connectedUsers;
    });

    var randomStocks = ['AAPL', 'MSFT', 'NHTC', 'XOM', 'MON', 'GLOB',
                        'STRP', 'AMBA', 'CEA', 'TROV', 'GTT', 'EBIX'];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      $scope.gotThings();
      socket.syncUpdates('thing', $scope.awesomeThings, $scope.gotThings);
    });

    $scope.addThing = function() {
      if($scope.newThing === '') {
        $scope.warning = null;
        return;
      }
      if($scope.newThing.replace(/[^a-zA-Z]/g, '') === '') {
        $scope.warning = 'Unwanted characters.';
        return;
      }
      if($scope.newThing.replace(/[^a-zA-Z]/g, '').split('').length > 10) {
        $scope.warning = 'Stock symbol is too long.';
        return;
      }

      $scope.warning = null;
      $scope.newThing = $scope.newThing;

      for (var i=0; i<$scope.awesomeThings.length; i+=1) {
        if ($scope.awesomeThings[i].name === $scope.newThing.toUpperCase()) {
          $scope.warning = 'Stock symbol already exists.';
          return;
        }
      }

      $http.post('/api/things', { name: $scope.newThing.toUpperCase().replace(/[^A-Z]/g, '') });
      $scope.newThing = '';
    };

    $scope.deleteThing = function(thing) {
      if ($scope.awesomeThings.length > 1) {
        $scope.warning = null;
        $http.delete('/api/things/' + thing._id);
        return;
      }
      $scope.warning = 'Must leave at least 1 stock symbol.';
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });

    $scope.addRandom = function() {
      var random = '';
      randomStocks.forEach(function(randomStock) {
        var checkStocks = $scope.awesomeThings.map(function(awesomeThing) {
          return awesomeThing.name;
        });
        if (checkStocks.indexOf(randomStock) === -1) {
          random = randomStock;
        }
      });

      $scope.newThing = random;
      $scope.addThing();
    };

    $scope.dismiss = function() {
      $scope.warning = null;
    };

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

                    tooltip: {
                        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                        valueDecimals: 2
                    },

                    series: seriesOptions
                });
            };

        $.each(names, function (i, name) {
            // 'http://www.highcharts.com/samples/data/jsonp.php?filename=' + name.toLowerCase() + '-c.json&callback=?'
            $.getJSON('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20' + 
                      'where%20symbol%20%3D%20%22' + name + '%22%20and%20startDate%20%3D%20%222014-06-07%22%20and%20endDate' + 
                      '%20%3D%20%222015-06-07%22&format=json&diagnostics=true&env=http%3A%2F%2Fdatatables.org%2' + 
                      'Falltables.env&callback=', function (data) {

                if (data.query.count === 0) {
                  console.log(name, 'does not exist.');
                  
                } else {

                  data = data.query.results.quote.map(function(dat) {
                      return [
                        new Date(dat.Date).getTime(),
                        parseFloat(parseFloat(dat.High).toFixed(2))
                      ];
                    });
                }

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
