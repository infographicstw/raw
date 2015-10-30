'use strict';

/* Controllers */

angular.module('raw.controllers', [])

  .controller('RawCtrl', function ($scope, dataService, $http) {

    $scope.samples = [
      { title : 'Cars (multivariate)', url : 'data/multivariate.csv' },
      { title : 'Movies (dispersions)', url : 'data/dispersions.csv' },
      { title : 'Music (flows)', url : 'data/flows.csv' },
      { title : 'Cocktails (correlations)', url : 'data/correlations.csv' },
      { title : '五都失業率', url : 'data/jobless.csv' },
      { title : '設計師實力 (for Radar Chart)', url : 'data/uxdesigner.csv' }
    ]

    $scope.$watch('sample', function (sample){
      if (!sample) return;
      dataService.loadSample(sample.url).then(
        function(data){
          $scope.text = data;
        }, 
        function(error){
          $scope.error = error;
        }
      );
    });

    // init
    $scope.raw = raw;
    $scope.data = [];
    $scope.metadata = [];
    $scope.error = false;
    $scope.loading = true;

    $scope.categories = ['Correlations', 'Distributions', 'Time Series', 'Hierarchies', 'Others'];

    $scope.parse = function(text){

      if ($scope.model) $scope.model.clear();

      $scope.data = [];
      $scope.metadata = [];
      $scope.error = false;
      $scope.$apply();

      try {
        var parser = raw.parser();
        $scope.data = parser(text);
        $scope.metadata = parser.metadata(text);
        $scope.error = false;
      } catch(e){
        $scope.data = [];
        $scope.metadata = [];
        $scope.error = e.name == "ParseError" ? +e.message : false;
      }
      if (!$scope.data.length && $scope.model) $scope.model.clear();
      $scope.loading = false;
    }

    $scope.delayParse = dataService.debounce($scope.parse, 500, false);

    $scope.$watch("text", function (text){
      $scope.loading = true;
      $scope.delayParse(text);
    });

    $scope.charts = raw.charts.values().sort(function (a,b){ return a.title() < b.title() ? -1 : a.title() > b.title() ? 1 : 0; });
    $scope.chart = $scope.charts[0];
    $scope.model = $scope.chart ? $scope.chart.model() : null;

    $scope.$watch('error', function (error){
      if (!$('.CodeMirror')[0]) return;
      var cm = $('.CodeMirror')[0].CodeMirror;
      if (!error) {
        cm.removeLineClass($scope.lastError,'wrap','line-error');
        return;
      }
      cm.addLineClass(error, 'wrap', 'line-error');
      cm.scrollIntoView(error);
      $scope.lastError = error;

    })

    $('body').mousedown(function (e,ui){
      if ($(e.target).hasClass("dimension-info-toggle")) return;
      $('.dimensions-wrapper').each(function (e){
        angular.element(this).scope().open = false;
        angular.element(this).scope().$apply();
      })
    })
    $scope.CSVEncoding = "UTF-8";
    $scope.uploadFromCSV = function() {
      $("#fromCSVModal").modal("show");
    };
    $scope.readCSV = function() {
      var file = $("#CSVFile")[0].files[0]
      var reader = new FileReader();
      reader.onload = function(e) { 
        $scope.$apply(function(){
          $scope.text = e.target.result;
        });
        $("#fromCSVModal").modal("hide");
      };
      reader.onerror = function(e) {};
      reader.readAsText(file, $scope.CSVEncoding);
    }

    $scope.uploadFromSpreadsheet = function() {
      $("#fromSpreadsheetModal").modal("show");
    };
    $scope.readSpreadsheet = function() {
      var ret = /\/d\/([^\/]+)/.exec($scope.spreadsheetURL);
      if(!ret) { return; }
      var key = ret[1];
      var cb = function(data) {
        var result = data.map(function(d) { return d.map(function(it) { return '"'+(it.replace(/[\r\n]/,"") || " ")+'"'; }).join(",");}).join("\n");
        $scope.text = result;
        $("#fromSpreadsheetModal").modal("hide");
      };
      $http({url:"https://spreadsheets.google.com/feeds/list/"+key+"/1/public/values?alt=json",method:"GET"}).success(function(e){var t,n,r,s,c;t={},e.feed.entry.map(function(e){var n,r,s=[];for(n in e)r=/^gsx\$(.+)$/.exec(n),r&&s.push(t[r[1]]=1);return s}),r=[];for(s in t)r.push(s);return n=r,c=[].concat([n]),e.feed.entry.map(function(e){var t,r,s,u,o;for(t=[],r=0,u=(s=n).length;u>r;++r){o=s[r];if(e["gsx$"+o]){t.push(e["gsx$"+o].$t)}else{t.push("")};}return c=c.concat([t])}),cb(c)}).error(function(){return cb([])});

    };

    $scope.codeMirrorOptions = {
      lineNumbers : true,
      lineWrapping : true,
      placeholder : '在此貼上你的資料或是拖個檔案過來吧。手邊沒資料的話，也可以先玩玩示範用的資料喔'
    }

    $scope.selectChart = function(chart){
      if (chart == $scope.chart) return;
      $scope.model.clear();
      $scope.chart = chart;
      $scope.model = $scope.chart.model();
    }

    function refreshScroll(){
      $('[data-spy="scroll"]').each(function () {
        $(this).scrollspy('refresh');
      });
    }

    $(window).scroll(function(){

      // check for mobile
      if ($(window).width() < 760 || $('#mapping').height() < 300) return;

      var scrollTop = $(window).scrollTop() + 0,
          mappingTop = $('#mapping').offset().top + 10,
          mappingHeight = $('#mapping').height(),
          isBetween = scrollTop > mappingTop + 50 && scrollTop <= mappingTop + mappingHeight - $(".sticky").height() - 20,
          isOver = scrollTop > mappingTop + mappingHeight - $(".sticky").height() - 20,
          mappingWidth = mappingWidth ? mappingWidth : $('.col-lg-9').width();
     
      if (mappingHeight-$('.dimensions-list').height() > 90) return;
      //console.log(mappingHeight-$('.dimensions-list').height())
      if (isBetween) {
        $(".sticky")
          .css("position","fixed")
          .css("width", mappingWidth+"px")
          .css("top","20px")
      } 

     if(isOver) {
        $(".sticky")
          .css("position","fixed")
          .css("width", mappingWidth+"px")
          .css("top", (mappingHeight - $(".sticky").height() + 0 - scrollTop+mappingTop) + "px");
          return;
      }

      if (isBetween) return;

      $(".sticky")
        .css("position","relative")
        .css("top","")
        .css("width", "");

    })

    $(document).ready(refreshScroll);


  })
