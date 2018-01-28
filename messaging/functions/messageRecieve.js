const lib = require('lib')({ token: "5UnLEsAiOfs5PwuHeNs7rh2jh0y3aCBmNFgXB_bX5yHIeGjYAUXfWGoQMhDLA8RL" });
const request = require('request')

/**
 * @param {string} sender The phone number that sent the text to be handled
 * @param {string} receiver The StdLib phone number that received the SMS
 * @param {string} message The contents of the SMS
 * @param {string} createdDatetime Datetime when the SMS was sent
 * @returns {string}
 */

module.exports = async(sender, receiver, message, createdDatetime, context) => {

    //STORAGE (just testing)
    let store = await lib.utils.storage.set('a', message);
    console.log('stored');
    let pull = await lib.utils.storage.get('a');

    console.log('Parsing...');

    //CHECK QUERY
    var mssg = message.toLowerCase();
    var type_full = mssg.match(/(treat|diagnose|describe)(,*)/i);
    var type = type_full[1];
    mssg = mssg.replace(type_full[0], '').trim();
    console.log(mssg);
    
    switch (type) {
        // -------------
        // DIAGNOSE CASE
        // -------------
        case 'diagnose': {
            console.log('sending sms with diagnosis response: ' + pull);
            
            //PARSE
            var age_full = mssg.match(/(\d+)(,*)/);
            var age = age_full[1];
            mssg = mssg.replace(age_full[0], '').trim();
            console.log("age: " + age);
            
            var sex_full = mssg.match(/(male|female|m|f|boy|girl)(,*)/i);
            var sex = sex_full[1];
            mssg = mssg.replace(sex_full[0], '').trim();
            if (sex == 'm' || sex == 'boy') sex = 'male';
            if (sex == 'f' || sex == 'girl') sex = 'female';
            console.log("sex: " + sex);
            
            //PARSE
            var symptoms = mssg.split(',').map(symptom => symptom.trim());
            console.log(symptoms);
            console.log(mssg);
    
            //GET ISSUES FROM DOCTOR API
            console.log('bouttadoitoem');
            let res = await lib.pwnclub.doctor['@dev']({
                _sex: sex, // (required)
                _age: age, // (required)
                _symptoms: symptoms // (required)
            });
            
            console.log(res);
            
            let message_response = `I am ${res[0].Accuracy}% sure you have ${res[0].Name}.\nHowever, other possible issues worth looking in to are:\n\n`;
            
            for (var i = 1; i < 4; i++) {
                message_response += `${i}. ${res[i].Name} (${Math.round(Number(res[i].Accuracy)*10)/10}%)\n`;
            }
    
            //TEXT USER USING MESSAGEBIRD API
            let result = await lib.messagebird.tel.sms({
                originator: receiver,
                recipient: sender,
                body: message_response
            });
            break;
        }
        // ----------
        // TREAT CASE
        // ----------
        case 'treat': {
            console.log('sending sms treatment response: ' + pull);
        
            //PARSE
            var issue = mssg;
            console.log(issuestr);
            
           // GET TREATMENT FROM DOCTOR API
            console.log('bouttadoitoem');
            let res = await lib.pwnclub.doctor['@dev'].treatments({
                _issue: issuestr, // (required)
            });
            
            //SEND DIAGNOSES USING MESSAGEBIRD APIs
            let result = await lib.messagebird.tel.sms({
                originator: receiver,
                recipient: sender,
                body: "Treatment Details: " + res + " at " + new Date()
            });
            break;
        }
        default: {
            console.log('sending sms FORMAT ERROR');

            let result = await lib.messagebird.tel.sms({
                originator: receiver,
                recipient: sender,
                body: "Error: BAD format: <" + pull + "> Please enter a proper format" + new Date()
            });
        }
    }
    
    return '200';

};
