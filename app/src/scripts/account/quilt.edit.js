'use strict';
var quiltEdit = (function($) {

  var $form = $('#quilts-form'),
      $editButton = $form.find('.edit-action'),
      $deleteButton = $form.find('.delete-action'),
      $typeSelect = $form.find('.type-select'),
      $confirmModal = $form.find('#delete-modal');

  function init() {

    if ($editButton.length > 0) {
      $typeSelect.material_select()
      initEvents()
    }
  }

  function initEvents() {
    $editButton.on('click', onEditClick)
    $deleteButton.on('click', onDeleteClick)
    $typeSelect.on('change', onStatusChange)
    $form.on('change', '.edit-input', onInputChange)
  }

  function onEditClick(e) {
    e.preventDefault()
    let $target = $(e.currentTarget.getAttribute('data-target'))
    console.log('TARGET', $target)
    $target.toggleClass('edit-mode')
  }

  function onDeleteClick(e) {
    e.preventDefault()
    var $currentTarget = $(e.currentTarget),
        $target = $(e.currentTarget.getAttribute('data-target')),
        actionUrl = '/quilts/' + $target.data('id');
    $confirmModal.find('.btn-delete').on('click', onConfirmClick($currentTarget, actionUrl))
    $confirmModal.modal('open')
  }

  function onConfirmClick($target, actionUrl) {
    $.ajax(actionUrl, {
      type: 'delete',
      statusCode: {
        200: function() {
          $target.closest('li').remove()
        },
        400: function() {
          alert( "page not found" )
        }
      }
    });
    $confirmModal.modal('close')
    $confirmModal.find('.btn-delete').off('click', onConfirmClick)
  }

  function onStatusChange(e) {
    e.preventDefault()
    console.log(e.currentTarget.value)
    var $target = $(e.currentTarget.getAttribute('data-target')),
        actionUrl = '/quilts/update/' + $target.data('id') + '/type/',
        formData = {
          'type': e.currentTarget.value
        };
    $.ajax(actionUrl, {
      type: 'patch',
      data: formData,
      statusCode: {
        200: function() {
        },
        400: function() {
          alert( "not updated" );
        }
      }
    });
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
          $target.next('.view-link').html(newName)
        },
        400: function() {
          alert( "not updated" )
        }
      }
    });
  }

  return {
    init: function() {
      init()
    },
    deinit: function() {
    }
  }
})(jQuery)
