﻿app.factory('appCache', ['$cacheFactory', function ($cacheFactory) {
  return $cacheFactory('appCache');
}]);

app.factory('fetchData', function (ApiService, $q, buildRootUrl) {
  var _cancel = function(scope) {
    if (angular.isFunction(scope.cancelFunc)) {
      scope.cancelFunc();
      scope.cancelFunc = undefined;
      return true;
    }
    return false;
  }
  return function(scope, options, datepicker) {
      var deferred = $q.defer();
      var url = buildRootUrl(options, datepicker);
      var data = [];
      scope.cancelFunc = scope.$watch(function() {
        return url;
      }, function(next) {
        if (angular.isUndefined(next) || next == null) return;
        ApiService.getList(next).then(
          function(response) {
            var d = response.data;
            var next_page = d.next_page_url;
            if (angular.isArray(d.data)) {
              for (var i in d.data) {
                data.push(d.data[i]);
              }
            }
            if (angular.isUndefined(next_page) || next_page == null) {
              deferred.resolve(data);
              _cancel(scope);
              return;
            }
            url = next_page;
          }, function(error) {
            _cancel(scope);
            deferred.reject(error);
          }
        );
      });
      return deferred.promise;
    };
  });

app.factory('buildRootUrl', function($httpParamSerializer) {
  return function(options, datepicker) {
    var query = {
      date_start: options.dates,
      date_end: options.dates,
      timezone: options.timezone
    };

    if (angular.isDefined(options.statusField) && angular.isDefined(options.status)) {
      query[options.statusField] = options.status;
    }

    // Override if necessary
    switch(options.dates) {
      case "last_30":
        query.date_start = -29;
        query.date_end = 0;
        break;
      case "last_7":
        query.date_start = -6;
        query.date_end = 0;
        break;
      case "custom":

        if (!datepicker.date_end) datepicker.date_end = new Date();
        if (!datepicker.date_start) datepicker.date_start = datepicker.date_end;

        query.date_start = datepicker.date_start.toISOString().substring(0, 10);
        query.date_end = datepicker.date_end.toISOString().substring(0, 10);
        break;
    }

    return '/' + options.dataset + '?' + $httpParamSerializer(query);
  };
});


app.factory('saveFile', function() {
  return function(name, type, data) {
    if (data != null && navigator.msSaveBlob)
      return navigator.msSaveBlob(new Blob([data], { type: type }), name);
    var a = angular.element("<a style='display: none;'/>");
    var url = window.URL.createObjectURL(new Blob([data], {type: type}));
    a.attr("href", url);
    a.attr("download", name);
    var body = angular.element(document).find('body').eq(0);
    body.append(a);
    a[0].click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };
});

app.factory('toCSV', function() {
  var mergeNestedObjects = function(parent) {
    if (angular.isArray(parent) || !angular.isObject(parent)) return;
    var keys = Object.keys(parent);
    for (var k in keys) {
      var key = keys[k];
      mergeNestedObjects(parent[key]);
    }

    var keys1 = Object.keys(parent);
    for (var k1 in keys1) {
      var key1 = keys1[k1];
      var value1 = parent[key1];
      if (angular.isArray(value1) || !angular.isObject(value1)) continue;
      var keys2 = Object.keys(value1);
      for (var k2 in keys2) {
        var key2 = keys2[k2];
        var value2 = value1[key2];
        parent[key1 + '.' + key2] = value2;
      }
      delete parent[key1];
    }
  };

  var to_csv = function(data, options) {
    var unraveled = [];
    // Unravel items if present, otherwise just push object on to unraveled.
    for (var i in data) {
      var row = angular.copy(data[i]);
      if (angular.isDefined(options.unravelField) && angular.isArray(row[options.unravelField])) {
        var items = row[options.unravelField];
        delete row[options.unravelField];
        for (var j in items) {
          var item = angular.copy(items[j]);
          var keys = Object.keys(item);
          for (var k in keys) {
            var key = keys[k];
            var value = item[key];
            delete item[key];
            item[ options.unravelField + '.' + key] = value;
          }
          unraveled.push(
            angular.merge(item, row)
          );
        }
      } else {
        unraveled.push(row);
      }
    }

    // Merge nested objects
    for (var i in unraveled) {
      mergeNestedObjects(unraveled[i]);
    }

    // Remove nested arrays and/or api urls.
    for (var i in unraveled) {
      var row = unraveled[i];
      var keys = Object.keys(row);
      for (var j in Object.keys(row)) {
        var key = keys[j];
        if (angular.isArray(row[key]) || key.match(/object$/)) {
          delete row[key];
          continue;
        }

        if (angular.isString(row[key]) && row[key].match(/\/api\/v1\//)) {
          delete row[key];
          continue;
        }
      }
    }

    return Papa.unparse(unraveled);
  };
  return to_csv;
});

app.factory('toCSV', function() {
  var mergeNestedObjects = function(parent) {
    if (angular.isArray(parent) || !angular.isObject(parent)) return;
    var keys = Object.keys(parent);
    for (var k in keys) {
      var key = keys[k];
      mergeNestedObjects(parent[key]);
    }

    var keys1 = Object.keys(parent);
    for (var k1 in keys1) {
      var key1 = keys1[k1];
      var value1 = parent[key1];
      if (angular.isArray(value1) || !angular.isObject(value1)) continue;
      var keys2 = Object.keys(value1);
      for (var k2 in keys2) {
        var key2 = keys2[k2];
        var value2 = value1[key2];
        parent[key1 + '.' + key2] = value2;
      }
      delete parent[key1];
    }
  };

  var to_csv = function(data, options) {
    var unraveled = [];
    // Unravel items if present, otherwise just push object on to unraveled.
    for (var i in data) {
      var row = angular.copy(data[i]);
      if (angular.isDefined(options.unravelField) && angular.isArray(row[options.unravelField])) {
        var items = row[options.unravelField];
        delete row[options.unravelField];
        for (var j in items) {
          var item = angular.copy(items[j]);
          var keys = Object.keys(item);
          for (var k in keys) {
            var key = keys[k];
            var value = item[key];
            delete item[key];
            item[ options.unravelField + '.' + key] = value;
          }
          unraveled.push(
            angular.merge(item, row)
          );
        }
      } else {
        unraveled.push(row);
      }
    }

    // Merge nested objects
    for (var i in unraveled) {
      mergeNestedObjects(unraveled[i]);
    }

    // Remove nested arrays and/or api urls.
    for (var i in unraveled) {
      var row = unraveled[i];
      var keys = Object.keys(row);
      for (var j in Object.keys(row)) {
        var key = keys[j];
        if (angular.isArray(row[key]) || key.match(/object$/)) {
          delete row[key];
          continue;
        }

        if (angular.isString(row[key]) && row[key].match(/\/api\/v1\//)) {
          delete row[key];
          continue;
        }
      }
    }

    return Papa.unparse(unraveled);
  };
  return to_csv;
});