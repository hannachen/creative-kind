'use strict';
var quiltEdit = (function($) {

  var $form = $('#quilts-form'),
      $editButton = $form.find('.edit-action'),
      $deleteButton = $form.find('.delete-action'),
      $confirmModal = $form.find('#delete-modal');

  function init() {

    if ($editButton.length > 0) {
      initEvents();
    }
  }

  function initEvents() {
    $editButton.on('click', onEditClick);
    $deleteButton.on('click', onDeleteClick);
    $form.on('change', '.edit-input', onInputChange);
  }

  function onEditClick(e) {
    e.preventDefault();
    var $target = $(e.currentTarget.getAttribute('data-target'));
    console.log('TARGET', $target);
    $target.toggleClass('edit-mode');
  }

  function onDeleteClick(e) {
    e.preventDefault();
    var $target = $(e.currentTarget),
        actionUrl = '/quilts/' + $target.data('id');
    $confirmModal.find('.btn-delete').on('click', onConfirmClick($target, actionUrl));
    $confirmModal.modal('show');
  }

  function onConfirmClick($target, actionUrl) {
    $.ajax(actionUrl, {
      type: 'delete',
      statusCode: {
        204: function() {
          $target.closest('li').remove();
        },
        400: function() {
          alert( "page not found" );
        }
      }
    });
    $confirmModal.modal('hide');
    $confirmModal.find('.btn-delete').off('click', onConfirmClick);
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
