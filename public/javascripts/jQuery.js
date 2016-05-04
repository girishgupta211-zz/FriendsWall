$(document).on('ready',function(){


  $(document).on('click', ".reqApprover", function(e) {
    var el =  $(this);
    var parameters = {requestorId: $(this).attr('requestorId')};
    $.get(
        "/approve",
        parameters,
        function(data) {  
          if(data == 'done'){
            el.parent().append('<p class="bg-success">Friend successfully added</p>');
            el.remove();
          }
        }
    );
    e.preventDefault();
  });


$(document).on('click', ".friendRequestee", function(e) {
    var el =  $(this);
    var parameters = {requesteeId: $(this).attr('requesteeId')};
    $.get(
        "/sendFriendReq",
        parameters,
        function(data) {  
          if(data == 'done'){
            el.parent().append('<p class="bg-success">Friend request successfully sent</p>');
            el.remove();
          }
        }
    );
    e.preventDefault();
  });

        
  $(".like-unlike").on('click', function(e) {

    var el =  $(this).children('span').first();
    var classes = el.attr("class");
    if (classes.indexOf('blue') > -1) {
        var parameters = { statusId: $(this).parent().parent().attr('id')};
        $.get(
            "/unlike",
            parameters,
            function(data) { 
              $(".likesDisplayer").text(data +' likes');
            }
        );
        el.removeClass('blue');
    }
    else {
        var parameters = { statusId: $(this).parent().parent().attr('id')};
        $.get(
            "/like",
            parameters,
            function(data) { 
              $(".likesDisplayer").text(data +' likes');
            }
        );
        el.addClass('blue');
    }
    e.preventDefault();
  });

  $(".comment-like").click(function(e) {
    var el =  $(this);
    if ($(this).html() == "Like") {
        var parameters = { commentId: $(this).attr('id')};
        $.get(
            "/likeComment",
            parameters,
            function(data) { 
              el.next('text').text(data);
            }
        );
        $(this).html('Unlike');
    }
    else {
        var parameters = { commentId: $(this).attr('id')};
        $.get(
            "/unlikeComment",
            parameters,
            function(data) { 
              el.next('text').text(data);
            }
        );
        $(this).html('Like');
    }
  });

  $(".likesDisplayer").click(function(e) {
    var el =  $(this);
    var parameters = {statusId: $(this).parent().parent().attr('id')};
    $.get(
        "/likersCount",
        parameters,
        function(data) { 
          $("#likersModal").find(".modal-body").empty();
          for(var i = 0; i < data.length; i++){        
            var appendable = '';
            if (data[i].picName) {
              appendable = appendable+'<img src="/images/'+data[i].picName+'" class="img-circle" alt="Cinque Terre" style="width:50px;height:45px;">'
            };

            appendable = appendable+'<p>'+ data[i].firstName+' '+ data[i].lastName;

            if(!data[i].isFriend){
              appendable = appendable+' <a class="friendRequestee" href="/howla" requesteeId="'+data[i]._id +'">Add as a Friend</a>';
            }
            appendable = appendable+'</p>';
              $("#likersModal").find(".modal-body").append(appendable);
          }
        }
    );
  });

  var noOfMessageLoadsDone = 1;

  $(window).scroll(function() {
    if($(window).scrollTop() + $(window).height() == $(document).height()) {
      if(!$.active){
        $.get(
          "/fetchMoreOnScroll",
          {loadsDone: noOfMessageLoadsDone},
          function(data) { 
            if(data){
              console.log(data);              
              for (var i = 0; i < data.length; i++) {
                (function(currDatum){
                  var datum = currDatum;
                  var statElem = $("div.statusSample").first().clone(true);

                  statElem.removeAttr('style');
                  statElem.removeClass('statusSample');
                  statElem.addClass('panel-google-plus');


                  statElem.attr("id", datum.statusData._id);
                  if(datum.statusData.statuserPicName){
                    statElem.children('div.panel-heading').find('img').attr("src", "/images/"+datum.statusData.statuserPicName);
                  }

                  statElem.children('div.panel-heading').find('h5').find('span').last().text(datum.timeStamp);

                  statElem.children('div.panel-heading').find('h3').text(datum.statusData.statuserFirstName+' '+datum.statusData.statuserLastName);
                  statElem.children('div.panel-body').find('p').text(datum.statusData.statusMessage);
                  if (datum.statusData.statusPicName) {
                    statElem.children('div.panel-body').find('img').attr("src", "/images/"+datum.statusData.statusPicName);
                  };
                  if(datum.isLiked){
                    statElem.children('div.panel-footer').find('span.glyphicon-thumbs-up').addClass('blue');
                  }
                  statElem.children('div.panel-footer').children('a.likesDisplayer').html(datum.likersCount + " likes");
                  statElem.find('div.panel-google-plus-comment img').attr('src', $('div.profile-userpic img').attr('src'));

                  for (var j = 0; j < datum.comments.length; j++) {


                    var f = $('div.commentSample').first().clone(true);
                    f.attr('class', 'media');
                    f.removeAttr('style');
                    
                    if(datum.comments[j].commentData.commenterPicName){
                      f.find('.media-left').find('img').attr('src', '/images/' + datum.comments[j].commentData.commenterPicName);
                    }
                    f.find('.media-body').find('h6').text(datum.comments[j].commentData.commenterFirstName +" "+datum.comments[j].commentData.commenterLastName);
                    f.find('.media-body').find('small').text(datum.comments[j].commentData.commentMessage);
                    f.find('.media-body').find('a.comment-like').attr('id', datum.comments[j].commentData._id);

                    if (datum.comments[j].isLiked) {
                      f.find('.media-body').find('a.comment-like').html("Unlike");  
                    } else {
                      f.find('.media-body').find('a.comment-like').html("Like");  
                    }
                    f.find('.media-body').find('text').text(datum.comments[j].likersCount);

                    statElem.find('div.comments').append(f);
                  };

                  statElem.insertAfter($('div.panel-google-plus').last());
                })(data[i]);
              };
              noOfMessageLoadsDone++;
            }
          }
        );
      }  
    }
  });




   $(document).on('click', '.panel-google-plus > .panel-footer > .input-placeholder, .panel-google-plus > .panel-google-plus-comment > .panel-google-plus-textarea > button[type="reset"]', function(event) {
        var $panel = $(this).closest('.panel-google-plus');
            $comment = $panel.find('.panel-google-plus-comment');
            
        $comment.find('.btn:first-child').addClass('disabled');
        $comment.find('textarea').val('');
        
        $panel.toggleClass('panel-google-plus-show-comment');
        
        if ($panel.hasClass('panel-google-plus-show-comment')) {
            $comment.find('textarea').focus();
        }
   });

   $(document).on('keyup', '.panel-google-plus-comment > .panel-google-plus-textarea > textarea', function(event) {
        var $comment = $(this).closest('.panel-google-plus-comment');
        
        $comment.find('button[type="submit"]').addClass('disabled');
        if ($(this).val().length >= 1) {
            $comment.find('button[type="submit"]').removeClass('disabled');
        }
   });


   $('.comment-submit').on('click', function(e){
      var el = $(this);
      var textareaBox = $(this).prev('textarea');
      var commentMessage = $(this).prev('textarea').val();
      var statusId = $(this).parent().parent().parent().attr('id');
      var parameters = { 'commentMessage' : commentMessage, 'statusId' : statusId};
      $.ajax({
       type: 'POST',
       url: '/comment',
       data: parameters,
       success: function(data)
       {
        var f = $('div.commentSample').first().clone(true);
        f.attr('class', 'media');
        f.removeAttr('style');
        if(data.commenterPicName){
          f.find('.media-left').find('img').attr('src', '/images/' + data.commenterPicName);
        }
        f.find('.media-body').find('h6').text(data.commenterFirstName+' '+data.commenterLastName);
        f.find('.media-body').find('small').text(data.commentMessage);
        f.find('.media-body').find('a.comment-like').attr('id', data._id);
        el.parent().parent().siblings('div.comments').prepend(f);
        textareaBox.val('');
      }
     });
      e.preventDefault();
   });





   $('div.profile-usermenu > ul > li').on('click', function(event) {
    
    var el = $(this);

    if (el.find('a').attr('href') == '/showFriends') {
      var f = $('div.mediaSample').first().clone(true);
      f.attr('class', 'media');
      f.removeAttr('style');
      $('div.profile-content').empty();

      $.get(
          "/showFriends",
          function(data) { 
            console.log(data.length)
            for (var i = 0; i < data.length; i++) {
              console.log(data[i].firstName)
              var mf = f.clone(true);
              mf.children('.media-left').children('a').children('img').attr('src', '/images/'+data[i].picName);
              mf.children('.media-left').children('a').children('img').attr('style',"width:100px;height:100px;");
              mf.children('.media-body').empty();
              mf.children('.media-body').append('<h4 class="media-heading">'+data[i].firstName+' '+data[i].lastName+'</h4>');
              mf.children('.media-body').append('<p>Phone: '+data[i].phone+'</p>');
              mf.children('.media-body').append('<p>Email: '+data[i].email+'</p>');
              
              $('div.profile-content').append(mf);
              
            };
          }
      );
      event.preventDefault();
    }

     else if (el.find('a').attr('href') == '/all') {
      var f = $('div.mediaSample').first().clone(true);
      f.attr('class', 'media');
      f.removeAttr('style');
      $('div.profile-content').empty();

      $.get(
          "/all",
          function(data) { 
            console.log(data.length)
            for (var i = 0; i < data.length; i++) {
              console.log(data[i].firstName)
              var mf = f.clone(true);
              mf.children('.media-left').children('a').children('img').attr('src', '/images/'+data[i].picName);
              mf.children('.media-left').children('a').children('img').attr('style',"width:100px;height:100px;");
              mf.children('.media-body').empty();
              mf.children('.media-body').append('<h4 class="media-heading">'+data[i].firstName+' '+data[i].lastName+'</h4>');
              mf.children('.media-body').append('<p>Phone: '+data[i].phone+'</p>');
              mf.children('.media-body').append('<p>Email: '+data[i].email+'</p>');
              mf.children('.media-body').append('<a class="friendRequestee" href="/howla" requesteeId="'+data[i]._id +'">Add as a Friend</a>');
              
              $('div.profile-content').append(mf);
              
            };
          }
      );
      event.preventDefault();
    } 

    else if (el.find('a').attr('href') == '/pendingReqs') {
      var f = $('div.mediaSample').first().clone(true);
      f.attr('class', 'media');
      f.removeAttr('style');
      $('div.profile-content').empty();

      $.get(
          "/pendingReqs",
          function(data) { 
            console.log(data.length)
            for (var i = 0; i < data.length; i++) {
              console.log(data[i].firstName)
              var mf = f.clone(true);
              mf.children('.media-left').children('a').children('img').attr('src', '/images/'+data[i].picName);
              mf.children('.media-left').children('a').children('img').attr('style',"width:100px;height:100px;");
              mf.children('.media-body').empty();
              mf.children('.media-body').append('<h4 class="media-heading">'+data[i].firstName+' '+data[i].lastName+'</h4>');
              mf.children('.media-body').append('<p>Phone: '+data[i].phone+'</p>');
              mf.children('.media-body').append('<p>Email: '+data[i].email+'</p>');
              mf.children('.media-body').append('<a class="reqApprover" href="/howla" requestorId="'+data[i]._id +'">Accept as a Friend</a>');
              
              $('div.profile-content').append(mf);
              
            };
          }
      );
      event.preventDefault();
    }

   });

$('.file-upload').click(function(){
    $('#status-file').click();
});

$('a.comment-reply').click(function(){
  $(this).siblings('.comment-reply-box').toggleClass('hide-box');
});

$(document).on('click', 'a.comment-likes-displayer', function(e){
  alert('Ok Got the click');
  e.preventDefault();
});

$('a.comment-replies-displayer').click(function(e){
  $(this).siblings('a.comment-reply').click();
  e.preventDefault();
})

$('a.view-more-comments').click(function(e){
  var statusId = $(this).parent().parent().attr('id');

      var el = $(this);
      var parameters = {'statusId' : statusId};
      $.ajax({
       type: 'GET',
       url: '/getComments',
       data: parameters,
       success: function(data)
       {
        for (var i = 0; i < data.length; i++) {
          
        }

        var f = $('div.commentSample').first().clone(true);
        f.attr('class', 'media');
        f.removeAttr('style');
        if(data.commenterPicName){
          f.find('.media-left').find('img').attr('src', '/images/' + data.commenterPicName);
        }
        f.find('.media-body').find('h6').text(data.commenterFirstName+' '+data.commenterLastName);
        f.find('.media-body').find('small').text(data.commentMessage);
        f.find('.media-body').find('a.comment-like').attr('id', data._id);
        el.parent().parent().siblings('div.comments').prepend(f);
        textareaBox.val('');
      }
     });



  e.preventDefault();
})

});

