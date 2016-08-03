var utils = (function ($, window) {
  return {
    /**
     * Serialize a form to an array.
     *
     * @param {object} form
     * @returns {Array} Serialized array of the form data
     */
    serializeArray: function(form) {
      var field, l, s = [];
      if (typeof form == 'object' && form.nodeName == "FORM") {
        var len = form.elements.length
        for (var i = 0; i < len; i++) {
          field = form.elements[i];
          if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
            if (field.type == 'select-multiple') {
              l = form.elements[i].options.length;
              for (j = 0; j < l; j++) {
                if (field.options[j].selected)
                  s[s.length] = {name: field.name, value: field.options[j].value};
              }
            } else if ((field.type != 'checkbox' && field.type != 'radio') || field.checked) {
              var dataSet = {};
              dataSet[field.name] = field.value;
              s[s.length] = dataSet;
            }
          }
        }
      }
      return s;
    },

    /**
     * Serialize a form to an object. TODO: take a closer look at this
     *
     * @param {object} form
     * @returns {object} Serialized object of the form data
     */
    seralizeObject: function(form) {
      var field, l, s = {};
      if (typeof form == 'object' && form.nodeName == "FORM") {
        var len = form.elements.length;
        for (var i = 0; i < len; i++) {
          field = form.elements[i];
          if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
            if (field.type == 'select-multiple') {
              l = form.elements[i].options.length;
              var arraySet = [];
              for (j = 0; j < l; j++) {
                if (field.options[j].selected)
                  var dataSet = {name: field.name, value: field.options[j].value};
                arraySet.push(dataSet);
              }
              s[field.name] = arraySet;
            } else if ((field.type != 'checkbox' && field.type != 'radio') || field.checked) {
              s[field.name] = field.value;
            }
          }
        }
      }
      return s;
    }
  };
})(jQuery, window);