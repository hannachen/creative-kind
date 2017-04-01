'use strict';
var invite = (function($) {

  var $inviteInput = $('#invite-field'),
      emails = [];

  function init() {

    if ($inviteInput.length > 0) {
      $inviteInput
        .tokenfield({
          delimiter: [',',' ',"\n","\r"],
          minLength: 3,
          limit: 5,
          inputType: 'email',
          createTokensOnBlur: true
        });
      initEvents();
    }
  }

  function onTokenfieldInit() {
    $inviteInput.data('bs.tokenfield').$input.addClass('validate');
  }

  function onCreateToken(e) {
    clearInput();
    var inputValue = getTokenValue(e);
    if (!utils.validateEmail(inputValue)) {
      $inviteInput.closest('.tokenfield').addClass('invalid');
      $inviteInput.data('bs.tokenfield').$input.addClass('invalid');
      return false;
    }
  }

  function onCreatedToken(e) {
    var inputValue = getTokenValue(e);
    emails.push(inputValue);
    console.log(emails);
    clearInput();
  }

  function clearInput() {
    $inviteInput.closest('.tokenfield').removeClass('invalid');
    $inviteInput.data('bs.tokenfield').$input.removeClass('invalid');
  }

  function onEditToken(e) {
    if (e.attrs.label !== e.attrs.value) {
      var label = e.attrs.label.split(' (');
      e.attrs.value = label[0] + '|' + e.attrs.value;
    }
  }

  function onRemovedToken(e) {
    var inputValue = getTokenValue(e);
    _.remove(emails, function(email) {
      return email === inputValue
    });
    alert('Token removed! Token value was: ' + e.attrs.value);
  }

  function getTokenValue(e) {
    var data = e.attrs.value.split('|');
    return data[1] || data[0];
  }

  function initEvents() {
    $inviteInput
      .on('tokenfield:initialize', onTokenfieldInit)
      .on('tokenfield:createtoken', onCreateToken)
      .on('tokenfield:createdtoken', onCreatedToken)
      .on('tokenfield:edittoken', onEditToken)
      .on('tokenfield:removedtoken', onRemovedToken);
  }

  return {
    init: function() {
      init();
    },
    deinit: function() {
    }
  }
})(jQuery);
