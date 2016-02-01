'use strict';
(function($,window) {

  var QuiltingBee = {
    init: function() {
      this.initVariables();
      this.initEvents();
      this.initPage();
    },
    initVariables: function() {
      this.$document = $(document);
    },
    initEvents: function() {
    },
    initPage: function() {
      // Allow Page URL to activate a tab's ID
      var taburl = document.location.toString();
      if( taburl.match('#') ) {
        $('.nav-pills a[href="#'+taburl.split('#')[1]+'"]').tab('show');
      }
    }
  }

  $(function() {
    QuiltingBee.init();
  });
})(jQuery,window);