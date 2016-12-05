'use strict';
(function($,window) {
  paper.install(window);

  var currentPage =  document.body.id;
  console.log('CURRENT PAGE', currentPage);

  $(function() {
    switch(currentPage) {
      case 'view-patch':
        // viewPatch.init();
        break;
      case 'edit-patch':
        console.log('INIT???');
        patch.init();
        break;
      default:
        break;
    }
  });

})(jQuery,window);
