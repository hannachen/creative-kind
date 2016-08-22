'use strict';
(function($,window) {

  window.mobileMq = 'screen and (min-width: 48em)';

  var QuiltingBee = {
    init: function() {
      this.initVariables();
      this.initEvents();
      this.initPage();
    },
    initVariables: function() {
      this.$drawerNav = $('#account-drawer, #submenu-drawer');
    },
    initEvents: function() {
      this.$drawerNav.on('show.bs.drawer', this.onDrawerOpen);
      this.$drawerNav.on('hidden.bs.drawer', this.onDrawerClose);
    },
    initPage: function() {
      // Allow Page URL to activate a tab's ID
      var taburl = document.location.toString();
      if(taburl.match('#')) {
        $('.nav-pills a[href="#'+taburl.split('#')[1]+'"]').tab('show');
      }
    },
    onDrawerOpen: function(e) {
      var $body = $('body'),
          $target = $(e.target),
          $overlay = $body.find('.overlay');
      if (!$overlay.length) {
        $overlay = $('<div class="overlay"></div>');
        $overlay.on('click', function() {
          $target.find('.drawer-toggle').trigger('click');
        });
        $overlay.appendTo($body);
      }
    },
    onDrawerClose: function() {
      $('.overlay').remove();
    }
  };

  $(function() {
    QuiltingBee.init();
  });
})(jQuery,window);