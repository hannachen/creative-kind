'use strict';
var viewPatch = (function($) {

  var $patchContents = $('.patch-actions');
  var $flashModal = $('#flash-modal');

  function init() {
    // Check for patch action contents
    if ($patchContents.length) {

      initEvents();

      // Check for flash message modal
      if ($flashModal.length) {

        // Prepare contents for download and shares
        var $modalActions = $patchContents.clone();
        $modalActions.append('<button class="btn" data-dismiss="modal">Skip</button>');

        // Append patch data to modal
        $modalActions.appendTo($flashModal.find('.modal-footer'));
      }
    }
  }

  function initEvents() {
    $patchContents.find('.download-link').on('click', onDownload);
    $patchContents.find('.social-link a').on('click', onShare);
  }

  function onDownload(e) {
    e.preventDefault();
  }

  function onShare(e) {
    e.preventDefault();
  }

  return {
    init: function() {
      init();
    },
    deinit: function() {
    }
  }
})(jQuery);
