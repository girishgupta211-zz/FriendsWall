var dbConfig = require('./database.js');
var mongoose = require('mongoose');
var express = require('express');
var swig = require('swig');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var app = express();
var methodOverride = require('method-override');

mongoose.connect(dbConfig.url);

app.set('views', path.join(__dirname, 'views'));
var swig = new swig.Swig();
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.use(methodOverride('_method'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var passport = require('passport');
var expressSession = require('express-session');

app.use(expressSession({secret: 'mySecretKey', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

var flash = require('connect-flash');
app.use(flash());

var initPassport = require('./passport/init');
initPassport(passport);

var routes = require('./routes/index')(passport);
app.use('/', routes);

var server = app.listen(8081, function () {
  console.log("Example app started listening at URL - http://localhost:8081, at %s", new Date());
})