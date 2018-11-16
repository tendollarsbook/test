$(document).ready(function(){
  $('.art-nav-del').on('click',function(e){
    e.preventDefault();
    var id = $(this).data('id');
    var title = $(this).data('title');
    if(confirm('確認是否刪除'+ title)){
      $.ajax({
        url:'/articlemange/delete/' + id,
        method: 'POST'
      }).done(function(response){
        window.location = '/articlemange';
      });
    }
  })
});


var open = document.querySelector('.btn-open');
  var draft = document.querySelector('.btn-private');
  function artopen(){
    open.className = "btn btn-open ys-checked"
    draft.className = "btn btn-private"
  };
  function artclose(){
    open.className = "btn btn-open"
    draft.className = "btn btn-private ys-checked"
  };
  open.addEventListener('click',artopen,false);
  draft.addEventListener('click',artclose,false);