var express = require('express');
var app = express();
app.use(express.static('js'));

app.use('/js', express.static('js'));
app.use('/fonts', express.static('fonts'));
app.use('/images', express.static('images'));
app.use('/css', express.static('css'));

app.engine('html', require('ejs').renderFile);

app.get('/', function(req, res) {
	res.render('index.html');
});

app.listen(process.env.PORT || 3000, function() {
  console.log('app start on port ' + process.env.PORT || 3000);
});