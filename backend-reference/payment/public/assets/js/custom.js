function notify(title, message, type) {
  $.notify({
    title: title,
    message: message
  }, {
    type: type,
    allow_dismiss: false,
    newest_on_top: false,
    mouse_over: false,
    showProgressbar: false,
    spacing: 10,
    timer: 400,
    placement: {
      from: 'top',
      align: 'right'
    },
    icon: 'fa fa-warning',
    offset: {
      x: 30,
      y: 30
    },
    delay: 1000,
    z_index: 10000,
    animate: {
      enter: 'animated bounce',
      exit: 'animated bounce'
    }
  });
  // get countries
}
$('.number').keypress(function (event) {
  var $this = $(this);
  if ((event.which != 46 || $this.val().indexOf('.') != -1) &&
    ((event.which < 48 || event.which > 57) &&
      (event.which != 0 && event.which != 8))) {
    event.preventDefault();
  }
  var text = $(this).val();
  if ((event.which == 46) && (text.indexOf('.') == -1)) {
    setTimeout(function () {
      if ($this.val().substring($this.val().indexOf('.')).length > 3) {
        $this.val($this.val().substring(0, $this.val().indexOf('.') + 3));
      }
    }, 1);
  }
  if ((text.indexOf('.') != -1) &&
    (text.substring(text.indexOf('.')).length > 2) &&
    (event.which != 0 && event.which != 8) &&
    ($(this)[0].selectionStart >= text.length - 4)) {
    event.preventDefault();
  }
});

$(".number").on("keypress", function (e) {
  var currentValue = String.fromCharCode(e.which);
  var finalValue = $(this).val() + currentValue;
  if (finalValue > 100) {
    e.preventDefault();
  }
});

$('.number').bind("paste", function (e) {
  var text = e.originalEvent.clipboardData.getData('Text');
  if ($.isNumeric(text)) {
    if ((text.substring(text.indexOf('.')).length > 3) && (text.indexOf('.') > -1)) {
      e.preventDefault();
      $(this).val(text.substring(0, text.indexOf('.') + 3));
    }
  } else {
    e.preventDefault();
  }
});