'use strict';
(function($,window) {
  paper.install(window);

  $(function() {
    if ($('#canvas-container').length) {
      quiltCanvas.init();
    }
    if ($('.invite').length) {
      invite.init();
    }
    theme.init();
    invite.init();
  });
})(jQuery,window);
