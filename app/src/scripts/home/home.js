'use strict';
(function($,window) {
  paper.install(window);

  var Home = {
    init: function() {
      this.initVariables();
      this.initEvents();
      this.initPage();
    },
    initVariables: function() {
    },
    initEvents: function() {
    },
    initPage: function() {
      console.log('INIT');
      quiltsList.init();
    }
  };

  $(function() {
    Home.init();
  });
})(jQuery,window);