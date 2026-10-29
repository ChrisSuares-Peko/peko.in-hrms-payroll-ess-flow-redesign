$(document).ready(function() {

    window.Parsley.addValidator('fileextension', function(value, requirement) {
            var tagslistarr = requirement.split(',');
            var fileExtension = value.split('.').pop();
            var arr = [];
            $.each(tagslistarr, function(i, val) {
                arr.push(val);
            });
            if (jQuery.inArray(fileExtension, arr) != '-1') {
                //console.log("is in array");
                //$('#file-upload-filename').show()
                return true;
            } else {
                //console.log("is NOT in array");
                $('#file-upload-filename').text('')
                return false;
            }
        }, 32)
        .addMessage('en', 'fileextension', 'The extension doesn\'t match the required');

    window.Parsley.addValidator('maxsize', {
        validateString: function(_value, maxSize, parsleyInstance) {
            var files = parsleyInstance.$element[0].files;
            return files.length != 1 || files[0].size <= maxSize * 1024;
        },
        requirementType: 'integer',
        messages: {
            en: 'File size should be less than %s Kb',
            ur: '500Kb فائل کا سائز اس سے کم ہونا چاہئے',
            ar: 'يجب أن يكون حجم الملف أقل من 500 كيلو بايت',
            hi: 'फ़ाइल का आकार %s Kb से कम होना चाहिए',
            ml: 'ഫയൽ വലുപ്പം 500 കെബിയിൽ കുറവായിരിക്കണം',
            ta: 'கோப்பு அளவு 500Kb க்கும் குறைவாக இருக்க வேண்டும்',
            ph: 'Ang laki ng file ay dapat na mas mababa sa 500Kb',
        }

    });



})