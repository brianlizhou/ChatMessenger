exports.addMessageToDB = (redisClient,message) => {
  redisClient.lpush('messages',message);  
};

exports.getMessages = (redisClient) => {
    redisClient.lrange('messages',0,-1,(err,value) => {
        if(err){
            console.log(err);
        }    
        redisClient.ltrim('messages',0,49);
        return value;
    });
}