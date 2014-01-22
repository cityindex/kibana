define([
  'angular',
  'app',
  'underscore',
  'jquery',
  'kbn',

  './Graph/Graph',
  './Graph/Utils'
 ],
 function (angular, app, _, $, kbn) {
  'use strict';

  var module = angular.module('kibana.panels.flexigraph', []);
  app.useModule(module);

  var _graph;

  module.controller('flexigraph', function($scope, querySrv, dashboard, filterSrv) {
    $scope.panelMeta = {
      modals : [
        {
          description: "Inspect",
          icon: "icon-info-sign",
          partial: "app/partials/inspector.html",
          show: $scope.panel.spyable
        }
      ],
      editorTabs : [
        {title:'Queries', src:'app/partials/querySelect.html'}
      ],
      status  : "Experimental",
      description : "Combined chart using dots and lines"
    };

    // Set and populate defaults
    var _d = {
      queries     : {
        mode        : 'all',
        ids         : []
      },
      style   : { "font-size": '10pt'},
      arrangement : 'horizontal',
      counter_pos : 'above',
      spyable : true
    };
    _.defaults($scope.panel,_d);

    $scope.init = function () {
      $scope.hits = 0;

      _graph = new FlexiGraph();
      _graph.init('FlexiGraph_');

      $scope.$on('refresh',function(){
        $scope.get_data();
      });
      $scope.get_data();

    };

    $scope.get_data = function(segment,query_id) {
      var
        _segment,
        request,
        boolQuery,
        results;

      $scope.panel.error =  false;

      // Make sure we have everything for the request to complete
      if(dashboard.indices.length === 0) {
        return;
      }

      $scope.panelMeta.loading = true;

      _segment = _.isUndefined(segment) ? 0 : segment;
      $scope.segment = _segment;

      request = $scope.ejs.Request().indices(dashboard.indices[_segment]);

      $scope.panel.queries.ids = querySrv.idsByMode($scope.panel.queries);
      var queries = querySrv.getQueryObjs($scope.panel.queries.ids);

      boolQuery = $scope.ejs.BoolQuery();
      _.each(queries,function(q) {
        boolQuery = boolQuery.should(querySrv.toEjsObj(q));
      });

      request = request.query(
        $scope.ejs.FilteredQuery(
          boolQuery,
          filterSrv.getBoolFilter(filterSrv.ids)
        ))
        .highlight(
          $scope.ejs.Highlight($scope.panel.highlight)
          .fragmentSize(2147483647) // Max size of a 32bit unsigned int
          .preTags('@start-highlight@')
          .postTags('@end-highlight@')
        )
        .size(10000000)
        .sort("@timestamp", "asc");

      $scope.inspector = angular.toJson(JSON.parse(request.toString()),true);

      results = request.doSearch();

      // Populate scope when we have results
      results.then(function(results) {
        $scope.panelMeta.loading = false;

        if(_segment === 0) {
          $scope.hits = 0;
          $scope.data = [];
          $scope.current_fields = [];
          query_id = $scope.query_id = new Date().getTime();
        }

        // Check for error and abort if found
        if(!(_.isUndefined(results.error))) {
          $scope.panel.error = $scope.parse_error(results.error);
          return;
        }

        // Check that we're still on the same query, if not stop
        if($scope.query_id === query_id) {

          // This is exceptionally expensive, especially on events with a large number of fields
          $scope.data = $scope.data.concat(_.map(results.hits.hits, function(hit) {
            var
              _h = _.clone(hit),
              _p = _.omit(hit,'_source','sort','_score');

            // _source is kind of a lie here, never display it, only select values from it
            _h.kibana = {
              _source : _.extend(kbn.flatten_json(hit._source),_p),
              highlight : kbn.flatten_json(hit.highlight||{})
            };

            // Kind of cheating with the _.map here, but this is faster than kbn.get_all_fields
            $scope.current_fields = $scope.current_fields.concat(_.keys(_h.kibana._source));

            return _h;
          }));

          $scope.current_fields = _.uniq($scope.current_fields);
          $scope.hits += results.hits.total;

        } else {
          return;
        }

        if (_segment+1 < dashboard.indices.length) {
          $scope.get_data(_segment+1,$scope.query_id);
        }

        _graph.update($scope.data);
      });
    };

    $scope.set_refresh = function (state) {
      $scope.refresh = state;
    };

    $scope.close_edit = function() {
      if($scope.refresh) {
        $scope.get_data();
      }
      $scope.refresh =  false;
      $scope.$emit('render');
    };

  });

  module.directive('flexigraphChart', function(querySrv) {
    return {
      restrict: 'A',
      link: function(scope, elem) {

        // Receive render events
        scope.$on('render',function(){
          render_panel();
        });

        // Re-render if the window is resized
        angular.element(window).bind('resize', function(){
          render_panel();
        });

        // Function for rendering panel
        function render_panel() {
          // IE doesn't work without this
          elem.css({height:scope.panel.height||scope.row.height});

          try {
            _.each(scope.data,function(series) {
            });
          } catch(e) {return;}

          try {
          } catch(e) {
            elem.text(e);
          }
        }

      }
    };
  });
});