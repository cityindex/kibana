module.exports = function(config) {
  return {
    dev: {
      options: {
        port: 5601,
        base: config.srcDir,
        keepalive: true,
        middleware: function(connect) {
            return [
              // for the modules to test
              connect.static(config.srcDir),
              // Inject mock data for call to /statuspage/component-status (which in live proxies to the StatusPage.io API)
              function(req, res, next) {
                if (req.url !== '/statuspage/component-status') {
                    return next();
                }
                res.writeHead(200, {'Content-Type': 'application/json' });
                res.end('{"status":"operational","name":"cityindex.logsearch.io (logsearch cluster)","created_at":"2013-08-06T14:34:56.571Z","updated_at":"2014-10-18T08:52:48.210Z","position":1,"description":"The City Index Logsearch cluster","id":"2vx2724ljl64","page_id":"rr6mvdg2czkt"}');
                //res.end('{"status":"degraded_performance","name":"cityindex.logsearch.io (logsearch cluster)","created_at":"2013-08-06T14:34:56.571Z","updated_at":"2014-10-18T09:15:59.961Z","position":1,"description":"The City Index Logsearch cluster","id":"2vx2724ljl64","page_id":"rr6mvdg2czkt"}');
                //res.end('{"status":"partial_outage","name":"cityindex.logsearch.io (logsearch cluster)","created_at":"2013-08-06T14:34:56.571Z","updated_at":"2014-10-18T09:16:41.968Z","position":1,"description":"The City Index Logsearch cluster","id":"2vx2724ljl64","page_id":"rr6mvdg2czkt"}');
                //res.end('{"status":"major_outage","name":"cityindex.logsearch.io (logsearch cluster)","created_at":"2013-08-06T14:34:56.571Z","updated_at":"2014-10-18T09:17:10.048Z","position":1,"description":"The City Index Logsearch cluster","id":"2vx2724ljl64","page_id":"rr6mvdg2czkt"}');
              }
            ];
        }
      }
    },
    unit_tests: {
      options: {
        port: 5602,
        keepalive: true,
        middleware: function (connect) {
          return [
            // mainly just for index.html
            connect.static(config.unitTestDir),
            // for the modules to test
            connect.static(config.srcDir),
            // contains mocha.js
            connect.static('node_modules/mocha'),
            // contains expect.js
            connect.static('node_modules/expect.js'),
            // bundle the spec files into one file that changes when needed
            function (req, resp, next) {
              if (req.url !== '/specs.js') {
                return next();
              }

              var Kat = require('kat');
              resp.statusCode = 200;
              resp.setHeader('Content-Type', 'application/javascript');
              var read = new Kat();
              require('glob')(config.unitTests, function (err, files) {
                if (err) {
                  next(err);
                  return;
                }

                files.forEach(function (file) {
                  read.add(file);
                });
                read.pipe(resp);
              });
            }
          ];
        }
      }
    }
  };
};