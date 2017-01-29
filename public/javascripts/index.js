(() => {         
    $(document).ready(() => {

        const original = document.title;
        let timeout;
        let numNewMessages = 0;

        window.flashTitle = function (newMsg) {
            function step() {
                let howManyTimes = 100000;
                document.title = (document.title == original) ? newMsg : original;

                if (--howManyTimes > 0) {
                    timeout = setTimeout(step, 500);
                };
            };

            cancelFlashTitle(timeout);
            step();
        };

        window.cancelFlashTitle = function () {
            clearTimeout(timeout);
            document.title = original;
        };
        
        window.onfocus = function () { 
          window.isActive = true;
          window.cancelFlashTitle();
          numNewMessages = 0;
        }; 

        window.onblur = function () { 
          window.isActive = false; 
        }; 

        
        
        const weekday = new Array(7);
          weekday[0] =  "Sunday";
          weekday[1] = "Monday";
          weekday[2] = "Tuesday";
          weekday[3] = "Wednesday";
          weekday[4] = "Thursday";
          weekday[5] = "Friday";
          weekday[6] = "Saturday";

        const formatDate = (date) => {
          const day = weekday[date.getDay()];
          let hours = date.getHours();
          let minutes = date.getMinutes();
          const ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          minutes = minutes < 10 ? '0'+minutes : minutes;
          const strTime = hours + ':' + minutes + ' ' + ampm;
          return day + " " + date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
        }
        
        let scrolled = false;
        let timeoutHandle = window.setTimeout(()=>{
            scrolled=false;
        },5000);    
        
        const updateScroll = () => {
            if(!scrolled){
                const element = document.getElementById("startlist");
                window.scrollTo(0,element.scrollHeight);
            }
        }

        $(window).on('scroll', () => {
            scrolled=true;
            window.clearTimeout(timeoutHandle);
            timeoutHandle = window.setTimeout(()=>{
                scrolled=false;
            },5000);
        });
        
        const addNewMessage = (message) => {
            const {name,text,date} = message;
            const side = name === window.username ? 'self' : 'other';
            const profilepicture = side === 'self' ? window.self : window.other;
            
            let html = '<li class=' + side + '>';
            html += '<div class=avatar>';
            html += '<img src=' + profilepicture + ' draggable=false>';
            html += '</div>';
            html += '<div class=msg>';
            html += '<p>' + text + '</p>';
            html += '<time>' + date +'</time>'
            html += '</div>';
            html += '</li>';
            
            $('#startlist').append(html);
            
            updateScroll();
        } 
        
                
        const server = io();
        const clientID = server.io.engine.id;

        const triggered = () => {
            window.username = $('#auth').val();
            window.self = window.username === 'BBR' ? 'images/Linda_Picture.jpg' : 'images/Brian_Picture.jpg';
            window.other = window.username === 'BBZ' ? 'images/Linda_Picture.jpg' : 'images/Brian_Picture.jpg'
            $('#headerImage').attr('src',window.self);
            document.getElementById('usernameTop').innerHTML = window.username === "BBR" ? 'Linda' : 'Brian';
            $('#auth').hide();
            $('#errormessage').hide();
            $('#whiteout').hide();
            $('#usertypebox').focus();
            
            server.emit('join',{id:clientID}, (message) => {
                message.reverse();
                for(let i=0; i<message.length; i++){
                    addNewMessage(JSON.parse(message[i]));
                } 
                const container = document.getElementById('startlist');
                updateScroll();
            });
            
            server.on('message',(message) => {
                addNewMessage(message);
                numNewMessages++;
                if(!window.isActive){
                    window.flashTitle(numNewMessages + ' New Msgs');
                }
            });
            
        };

        const fail = () => {
            $('#auth').val('');
            $('#errormessage').show();
            $('#auth').focus();
        }

         $('#usertypebox').keyup(function(e){
             if(e.keyCode == 13){
                const text = $('#usertypebox').val();
                 if(text !== ''){
                     server.emit('message',{name:window.username,text:text,date:formatDate(new Date())});
                 }
                 $('#usertypebox').val('');
                 $('#usertypebox').focus();
             }
         });
        
        $('#auth').keyup(function(e) {
            if(e.keyCode == 13) {
                server.emit('authenticated',{id:clientID,password:$('#auth').val()},function(status){
                    if(status == 'success'){
                        triggered();
                    }
                    else{
                        fail();
                    }
                });
            }    
        });
    });
                
})();