'use strict';
var create = (function($) {

  var $createQuiltForm = $('#create-quilt-form');

  function init() {

    console.log('create init', $createQuiltForm);

    if ($createQuiltForm.length > 0) {

      initEvents();
    }
  }

  function initEvents() {

    $createQuiltForm.on('submit', function(e) {
      e.preventDefault();
      var form = e.currentTarget,
          actionUrl = form.getAttribute('action'),
          formData = utils.seralizeObject(form);
      $.ajax(actionUrl, {
        type: 'post',
        data: formData,
        statusCode: {
          200: function() {
          },
          404: function() {
            alert( "page not found" );
          }
        }
      });
    });
  }

  return {
    init: function() {
      init();
    },
    deinit: function() {
    }
  }
})(jQuery);
