'use strict';
(function($,window) {
  paper.install(window);

  $(function() {
    if ($('#canvas-container').length) {
      quiltCanvas.init();
    }
    theme.init();
    invite.init();
    create.init();
    sharePatch.init();
  });
})(jQuery,window);
