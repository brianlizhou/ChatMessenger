const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const routes = require('./routes/index');
const path = require('path');

server.listen(process.env.PORT || 3000);

let redis;

if(process.env.REDISTOGO_URL){
    const rtg = require("url").parse(process.env.REDISTOGO_URL);
    redis = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]); 
}
else{
    redis = require('redis').createClient();
}


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

redis.on('connect',function(){
   console.log('connected to redis'); 
});

app.use(express.static(path.join(__dirname, 'public')));

    
// set the home page route
app.get('/', (req,res) => {
	// ejs render automatically looks in the views folder
	res.render('index');
});

const addMessageToDB = (message) => {
    redis.lpush('messages',JSON.stringify(message));  
};

io.sockets.on('connection',function(socket){
   socket.on('authenticated', (data,callback) => {
       //Uncomment to wipe out message database
       //redis.del('messages');
       if(process.env.linda == data.password || process.env.brian == data.password){
           callback('success');
       }
       else{
           callback('fail');
       }
   });
    
   socket.on('join',(data,callback) => {
       redis.lrange('messages',0,-1, (err,result) => {
           if(err){
               console.log(err);
           }
           callback(result);
       });
   });
   
       
   socket.on('message',(data) => {
       addMessageToDB(data);
       io.emit('message',data);
   });
});
