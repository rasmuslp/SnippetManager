(function () {
  'use strict';


  angular.module('common.filters', [])

  .filter('tagFill', function () {
    return function(snippet, values) {
      var text = snippet.content;
      var newText = text;
      for (var variableIndex in snippet.variables) {
        if (snippet.variables.hasOwnProperty(variableIndex)) {

          var variable = snippet.variables[variableIndex];
          if (values.hasOwnProperty(variable.tag) && values[variable.tag].length > 0) {
            newText = newText.replace(new RegExp(variable.tag, 'g'), values[variable.tag]);
          } else if (variable.placeholder && variable.placeholder.length > 0) {
            newText = newText.replace(new RegExp(variable.tag, 'g'), '(' + variable.placeholder + ')');
          }
        }
      }

      return newText;
    };
  })

  .filter('html', function($sce) {
    return function(val) {
      return $sce.trustAsHtml(val);
    };
  });

}());