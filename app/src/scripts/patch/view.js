'use strict';
var viewPatch = (function($) {

  var $patchActions = $('.patch-actions')
  var $flashModal = $('#flash-modal')

  function init() {
    // Check for patch action contents
    if ($patchActions.length) {

      initEvents()
    }
  }

  function initEvents() {
    $patchActions.find('.social-link a').on('click', onShare)
  }

  function onShare(e) {
    e.preventDefault()

    var $patchActions = function() {
      document.getElementById('shareBtn').onclick = function() {
        FB.ui({
          method: 'share',
          display: 'popup',
          href: 'https://developers.facebook.com/docs/',
        }, function(response){})
      }
    }
  }

  return {
    init: function() {
      init()
    },
    deinit: function() {
    }
  }
})(jQuery)
