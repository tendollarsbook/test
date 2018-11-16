var express = require('express');
var router = express.Router();
var firebaseAdminDb = require('../connections/firebase_admin');
var firebase = require('../connections/firebase_auth');
var fireAuth = firebase.auth();
var stringtags = require('striptags');
var moment = require('moment');
var convertPagination = require('../modules/convertPagination');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true});


var categoriesRef = firebaseAdminDb.ref('/categories/');
var articlesRef = firebaseAdminDb.ref('/articles/');
var emailsRef = firebaseAdminDb.ref('/emails/');


// 首頁
router.get('/', csrfProtection, function(req, res, next) {
  var currentPage = Number.parseInt(req.query.page) || 1;
  var categories ={};
  var auth = req.session.uid;
  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value');
  }).then(function(snapshot){
    var articles = [];
    snapshot.forEach(function(snapshotChild){
      if('public' === snapshotChild.val().status){
        articles.push(snapshotChild.val());
      }
    });
    articles.reverse();

    var data = convertPagination(articles, currentPage);

    res.render('index',{
      csrfToken: req.csrfToken(),
      errors: req.flash('errors'),
      auth: auth,
      articles: data.data,
      categories: categories,
      stringtags: stringtags,
      moment: moment,
      page: data.page
    });
  });
});

//電子報

router.post('/', csrfProtection ,function(req, res){
  var data = req.body.email;
  var EmailsRef = emailsRef.push();
  var key = EmailsRef.key;
  var emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
  console.log(data)
  if(data == ''){
    req.flash('errors','信箱不可為空哦！')
    res.redirect('/');
    return
  }
  if(emailRule.test(data)!= true){
    req.flash('errors','這不是信箱的格式哦！');
    res.redirect('/');
    return
  }
  emailsRef.orderByChild('emailer').equalTo(data).once('value')
  .then(function(snapshot){
    // console.log(snapshot.val())
    if (snapshot.val() !== null){
      req.flash('errors','這個信箱已經訂閱過了哦！');
      res.redirect('/');
      }else{
        firebaseAdminDb.ref('/emails/'+key).set({emailer: data,id: key});
        req.flash('errors','感謝你的訂閱！')
        res.redirect('/');
      }
    })
})

//退訂電子報
router.get('/emailcancel',function(req, res){
  var messages = req.flash('cancelerrors');
  res.render('emailcancel',{
    messages: messages,
    hasInfo: messages.length > 0
  });
})

router.post('/emailcancel',function(req, res){
  var mailer = req.body.cancelemail
  emailsRef.orderByChild('emailer').equalTo(mailer).once('value')
    .then(function(snapshot){
      if(snapshot.val() !== null){
        var key = ''
        snapshot.forEach(function(snapshotChild){
          key = snapshotChild.val().id
        })
        emailsRef.child(key).remove();
        req.flash('cancelerrors','感謝這段時間的支持！');
        res.redirect('/emailcancel');
      }else{
        console.log('false')
        req.flash('cancelerrors','這個信箱以前沒申請過唷！');
        res.redirect('/emailcancel');
      }
    })
})

// 內頁
router.get('/post/:id', function(req, res, next) {
  var id = req.param('id');
  var categories = {};
  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
    }).then(function(snapshot){
      var article = snapshot.val();
      if(!article){
        return res.render('error',{
          title: '找不到該文章 ><'
        });
      }; 
      res.render('post',{
        categories: categories,
        article: article,
        moment: moment
      });
    });
});

// 分類文章
router.get('/categoryarticle', function(req, res, next) {
  var currentPage = Number.parseInt(req.query.page) || 1;
  var categories ={};
  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value');
  }).then(function(snapshot){
    var articles = [];
    snapshot.forEach(function(snapshotChild){
      if('public' === snapshotChild.val().status){
        articles.push(snapshotChild.val());
      }
    });
    articles.reverse();

    var data = convertPagination(articles, currentPage);

    res.render('categoryarticle',{
      articles: data.data,
      categories: categories,
      stringtags: stringtags,
      moment: moment,
      page: data.page
    });
  });
});

router.get('/categoryarticle/:path', function(req, res, next) {
  var currentPage = Number.parseInt(req.query.page) || 1;
  var categories ={};
  var cateid = '';
  var catepath = req.param('path');
  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val(); 
  });
  categoriesRef.orderByChild('path').equalTo(catepath).once('value')
  .then(function(snapshot){
    snapshot.forEach(function(snapshotChild){
      cateid = snapshotChild.val().id
      catename= snapshotChild.val().name
    })
  })

  categoriesRef.once('value').then(function(snapshot){
    categories = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value');
  }).then(function(snapshot){
    var articles = [];
    snapshot.forEach(function(snapshotChild){
      if('public' === snapshotChild.val().status){
        if(cateid === snapshotChild.val().category){
          articles.push(snapshotChild.val());
        }
      }
    });

    articles.reverse();

    var data = convertPagination(articles, currentPage);

    res.render('categoryarticle',{
      articles: data.data,
      categories: categories,
      stringtags: stringtags,
      moment: moment,
      page: data.page,
      catename: catename,
      catepath: catepath
    });
  });
});

// 後台管理登入
router.get('/signin', function(req, res, next) {
  if(req.session.uid){
    res.redirect('/articlemange');
  }else{
    res.render('signin');
  }
});

router.post('/signin', function(req, res){
  fireAuth.signInWithEmailAndPassword(req.body.email,req.body.passwd)
  .then(function(user){
    console.log(user.user.uid)
    req.session.uid = user.user.uid;
    res.redirect('/articlemange');
  })
  .catch(function(error){

    res.redirect('/signin');
  })
})

module.exports = router;
