$(document).ready(function(){
  $('#fromGroup').on('change', () => {
    $.post('/check-group', {
      group: $('#fromGroup').val()
    }, (response) => {
      console.log(response);
    });
  });
  $('#toGroup').on('change', () => {
    $.post('/check-group', {
      group: $('#toGroup').val(),
    }, (response) => {
      console.log(response);
    });
  });
});