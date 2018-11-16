var express = require('express');
var router = express.Router();
var firebaseAdminDb = require('../connections/firebase_admin');
var stringtags = require('striptags');
var moment = require('moment');
var nodemailer = require('nodemailer');
var convertPagination = require('../modules/convertPagination');

var categoriesRef = firebaseAdminDb.ref('/categories/');
var articlesRef = firebaseAdminDb.ref('/articles/');
var emailsRef = firebaseAdminDb.ref('/emails/');


// 登出

router.get('/signout', function(req, res){
    console.log(req.session)
    req.session.uid = '';
    console.log(req.session)
    res.redirect('/');
})

// 文章輸入

router.get('/editarticle/create', function(req, res, next) {
  categoriesRef.once('value').then(function(snapshot){
    var categories = snapshot.val();
    res.render('editarticle',{
      categories: categories
    });
  });
});

router.get('/editarticle/:id', function(req, res, next) {
  var id = req.param('id');
  var categories = {};
  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
    }).then(function(snapshot){
      var article = snapshot.val();
      //  console.log(article);  
      res.render('editarticle',{
        categories: categories,
        article: article,
      });
    });
});

router.post('/editarticle/create', function(req, res){
  var data = req.body;
  var articleRef = articlesRef.push();
  var key = articleRef.key;
  var updateTime = Math.floor(Date.now() / 1000);
  data.id = key;
  data.len = data.category.length;
  data.update_time = updateTime;
  console.log(data)
  console.log('data'+data.category[0])

  articleRef.set(data).then(function(){
    res.redirect(`/editarticle/${key}`);
  })
});

router.post('/editarticle/update/:id', function(req, res){
  var data = req.body;
  var id = req.param('id');
  articlesRef.child(id).update(data).then(function(){
    res.redirect(`/editarticle/${id}`);
  })
});

// 文章管理

router.get('/articlemange', function(req, res, next) {
  var status = req.query.status || 'public';
  var categories ={};
  var currentPage = Number.parseInt(req.query.page) || 1;
  // var data = convertPagination(articles, currentPage);

  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value');
  }).then(function(snapshot){
    var articles = [];
    snapshot.forEach(function(snapshotChild){
      if(status === snapshotChild.val().status){
        articles.push(snapshotChild.val());
      }
    });
    articles.reverse();
    var data = convertPagination(articles, currentPage);

    res.render('articlemange',{
      articles: data.data,
      categories: categories,
      stringtags: stringtags,
      moment: moment,
      status: status,
      page: data.page
    });
  });
});

router.post('/articlemange/delete/:id', function(req, res){
  var id = req.param('id');
  articlesRef.child(id).remove();
  req.flash('info','文章已刪除');
  res.send('文章已刪除');
  res.end();
})

router.post('/articlemange/delete/:id', function(req, res){
  var id = req.param('id');
  articlesRef.child(id).remove();
  req.flash('info','文章已刪除');
  res.send('文章已刪除');
  res.end();
})

// 預覽內頁文章

router.get('/editpost/:id', function(req, res){
  var id = req.param('id');
  var categories = {};
  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
    }).then(function(snapshot){
      article = snapshot.val();
      if(!article){
        return res.render('error',{
          title: '找不到該文章 ><'
        });
      }; 
      res.render('editpost',{
        categories: categories,
        article: article,
        moment: moment,
        id: id
      });
    });
});

// 電子報寄送

router.get('/mailto/:id', function(req, res) {
  var mailmessages =req.flash('mailinfo')
  var id = req.param('id');
  var categories = {};
  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
    }).then(function(snapshot){
      var article = snapshot.val();  
      res.render('mailto',{
        categories: categories,
        article: article,
        mailmessages: mailmessages,
        hasInfo: mailmessages.length > 0
      });
    });
});

router.post('/mailto/:id', function(req, res) {
  var id = req.param('id');
  var emailers = [];
  var emailcontent = '';
  var emailtitle = '';

  categoriesRef.once('value').then(function(snapshot){
    return articlesRef.child(id).once('value');
    }).then(function(snapshot){
      emailcontent = snapshot.val().content;
      emailtitle = snapshot.val().title
      return emailsRef.once('value');
    }).then(
      function(snapshot){
          var data = snapshot.val();
          for(var item in data){
            emailers.push(data[item].emailer)
          }
        }).then(function(){
          var len = emailers.length;
          var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth:{
                user: process.env.GMAIL_ACCOUNT ,
                pass: process.env.GMAIL_PW
                }
              });
          for(i=0;i<len;i++){
            var mailOptions = {
              from: '"十元部落"sysuproject@gmail.com',
              to: emailers[i],
              subject: emailtitle,
              html: emailcontent
            }
            transporter.sendMail(mailOptions)}
        }).then(
            req.flash('mailinfo','電子報已寄送成功')
          );
  res.redirect(`/mailto/${id}`)
});

// 分類管理

router.get('/categories', function(req, res, next) {
  var messages = req.flash('info');
  categoriesRef.once('value').then(function(snapshot){
    var categories = snapshot.val();
    res.render('categories',{
      messages: messages,
      hasInfo: messages.length > 0,
      categories: categories
    });
  });
});

router.post('/categories/create', function(req, res){
  var data = req.body;
  var categoryRef = categoriesRef.push();
  var key = categoryRef.key;
  data.id = key;
  categoriesRef.orderByChild('path').equalTo(data.path).once('value')
  .then(function(snapshot){
    if (snapshot.val() !== null){
      req.flash('info','已有相同路徑');
      res.redirect('/categories');
    } else{
      categoryRef.set(data).then(function(){
        res.redirect('/categories');
      });
    }
  });
});

router.post('/categories/delete/:id', function(req, res){
  var id = req.param('id');
  categoriesRef.child(id).remove();
  req.flash('info','欄位已刪除')
  res.redirect('/categories');
});

module.exports = router;