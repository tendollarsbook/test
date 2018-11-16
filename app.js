var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var session = require('express-session');
var logger = require('morgan');
var validator = require('express-validator');

require('dotenv').config();

var indexRouter = require('./routes/index');
var dashboardRouter = require('./routes/dashboard');
// var authRouter = require('./routes/auth');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs',require('express-ejs-extend'))
app.set('view engine', 'ejs');
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: {maxAge: 100 * 1000}
}));
app.use(validator());
app.use(flash());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 增加靜態檔案路徑
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);


// 管理者驗證
var authCheck= function(req,res,next){
  console.log(req.session.uid)
  if(req.session.uid){
    return next();
  }
  return res.redirect('/');
};

// app.use('/',authCheck ,dashboardRouter);
app.use('/' ,dashboardRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.render('error',{
    title: "您所查看的頁面不存在:'("
  })
});

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
