'use strict';

app.factory('StringConverterService', ['$sce', function($sce){
    return {
        
        splitIntoParagraphs: function(comment){

            var blockquoteString, blockquoteSplitList, splitComment, paragraphSplit, newString;
            var splitComment = [];
            var finalText = [];
            
            blockquoteString = comment.replace(/<blockquote>/g , '?p*1n1?2*+=<blockquote>');
            blockquoteString = blockquoteString.replace(/<\/blockquote>/g , '</blockquote>?p*1n1?2*+=');
            blockquoteSplitList = blockquoteString.split('?p*1n1?2*+=');
            // console.log(blockquoteSplitList);


            angular.forEach(blockquoteSplitList, function(string){
                if(string.indexOf('<blockquote>') !== 0){
                    string = string.replace(/<\/p><p>/g , '</p>?p*1n1?2*+=<p>');
                    paragraphSplit = string.split('?p*1n1?2*+=');
                    splitComment.push.apply(splitComment, paragraphSplit);
                }else{
                    splitComment.push(string);
                }
            });

            // angular.forEach(splitComment, function(string){
            //     newString = $sce.trustAsHtml(string);
            //     console.log(newString);
            //     finalText.push(newString);
            // });

            // console.log(finalText);

            return splitComment;
        },


        determineFontSize: function(string){
            if(string.length > 26){
                return '7pt';        
            }else if(25 >= string.length > 21){
                return '8pt';
            }else if(20 >= string.length > 16){
                return '9pt';
            }else{
                return '10pt';
            }
        },

        processRawComment: function(comment, isTopLevel){
            var processedComment = this.splitIntoParagraphs(comment);
            // if(isTopLevel && processedComment[0].length < 108){
            //     processedComment.shift();
            // }
            return processedComment;
        },



        processNotification: function(notification){

            var notificationText;

            if(notification.length === 1){
                notificationText = notification[0];
            }else if(notification.length === 2){
                notificationText = notification[0] + ' and ' + notification[1];
            }else if(notification.length === 3){
                notificationText = notification[0] + ', ' + notification[1] + ', and ' + notification[2];
            }else if(notification.length > 3){
                notificationText = notification[0] + ', ' + notification[1] + ', ' + notification[2] + ', and ' + (notification.length - 3) + ' more'
            }

            return notificationText;

        }

    };
}]);
