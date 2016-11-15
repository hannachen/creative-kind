'use strict';
var quiltEdit = (function($) {

  var $editButton = $('.edit-action'),
      $form = $('#quilts-form');

  function init() {

    if ($editButton.length > 0) {
      initEvents();
    }
  }

  function initEvents() {
    $editButton.on('click', onEditClick);
    $form.on('change', '.edit-input', onInputChange);
  }

  function onEditClick(e) {
    e.preventDefault();
    var $target = $(e.currentTarget.getAttribute('data-target'));
    console.log('TARGET', $target);
    $target.toggleClass('edit-mode');
  }

  function onInputChange(e) {
    var $target = $(e.currentTarget),
        newName = e.currentTarget.value,
        quiltId = e.currentTarget.getAttribute('data-id'),
        actionUrl = $form.attr('action') + '/' + quiltId,
        formData = {
          'title': newName
        };
    $.ajax(actionUrl, {
      type: 'post',
      data: formData,
      statusCode: {
        200: function() {
          $target.closest('li').toggleClass('edit-mode');
          $target.next('.view-link').html(newName);
        },
        404: function() {
          alert( "page not found" );
        }
      }
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
