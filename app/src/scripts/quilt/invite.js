'use strict';
var invite = (function($) {

  var $inviteInput = $('.invite-field');

  function init() {

    if ($inviteInput.length > 0) {
      console.log('TEST');
      $inviteInput.tokenfield({
        delimiter: [',',' ',"\n","\r"]
      });
      initEvents();
    }
  }

  function initEvents() {
  }

  return {
    init: function() {
      init();
    },
    deinit: function() {
    }
  }
})(jQuery);
