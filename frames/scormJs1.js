tl_sco_data={
    suspend_data:null,
    lesson_location:null,
    total_time:0,
    lesson_status:null,
    datafromlms:null,
    score_raw:null,
    entry:null

}
SCOState = {
    suspend_data:tl_sco_data.suspend_data,
    lesson_location: tl_sco_data.lesson_location,
    total_time: tl_sco_data.total_time,
    lesson_status: tl_sco_data.lesson_status,
    datafromlms:tl_sco_data.datafromlms,
    score:  tl_sco_data.score_raw,
    entry: tl_sco_data.entry
};

/*LMS Initializations. Among many operations, we attach LMS functions to the API adapter and initialize data model (cmi).*/
var _DEBUG = true;
window.API     = API;
var _TEMP  = '';
var _TEMP2  = '';
myInitError();
myCurrentState = -1;
cmi  = new myCmi();


API.LMSInitialize     = LMSInitialize;
API.LMSFinish         = LMSFinish;
API.LMSGetValue       = LMSGetValue;
API.LMSSetValue       = LMSSetValue;
API.LMSCommit         = LMSCommit;
API.LMSGetLastError   = LMSGetLastError;
API.LMSGetErrorString = LMSGetErrorString;
API.LMSGetDiagnostic  = LMSGetDiagnostic;

/**
* This function is the API adapter. To this are attached all LMS functions, which are defined below,
* so that the content may access them.
*/
function API(){}

/*
########################## LMS Functions ################################

These functions implement the SCORM protocol. However, they use corresponding oxiliary
functions to the the real job. They all initially call myInitError(), which
sets the LMS error code to 0. This is done because each new call to an LMS
function needs to set a new error code, which remains 0 unless an error occurs.

#########################################################################
*/

/**
* Content initialization.
*/
function LMSInitialize(parameter)
{
_TEMP  = '';
_TEMP2  = '';

myInitError();
myCurrentState = -1;
cmi = new myCmi();

try {
    return_value  = myInitialize(parameter);
} catch(e) {
    myErrorHandler(e);
} finally {
    if (_DEBUG) console.log("Function: LMSInitialize \nArgument: '"+parameter+"' \nReturns: '"+return_value+"'");        
}
return return_value;
}

/**
* Content finalization.
*/
function LMSFinish(parameter)
{
myInitError();

try {
    return_value  = myFinish(parameter);
} catch(e) {
    myErrorHandler(e);
} finally {
    if (_DEBUG) console.log("Function: LMSFinish \nArgument: '"+parameter+"' \nReturns: '"+return_value+"'");        
}
return return_value;
}

/**
* Get paramater value.
*/
function LMSGetValue(parameter)
{
if (_DEBUG) console.log("Entering LMSGetValue, argument: '"+parameter+"'");

myInitError();
return_value  = myGetValues(parameter);

if (_DEBUG) console.log("Exiting LMSGetValue, returns: '"+return_value+"'");

return return_value;
}

/**
* Set parameter value.
*/
function LMSSetValue(parameter, value)
{	
if (_DEBUG) console.log("Entering LMSSetValue, argument: '"+parameter+"', set value: '"+value+"'");

myInitError();
return_value  = mySetValues(parameter, value);

if (_DEBUG) console.log("Exiting LMSSetValue, returns: '"+return_value+"'");
return return_value;
}

/**
* Orders LMS to store all content parameters
*/
function LMSCommit(parameter)
{
if (_DEBUG) console.log("Entering LMSCommit, argument: "+parameter);

myInitError();
return_value = myCommit(parameter);

if (_DEBUG) console.log("Exiting LMSCommit, returns: "+return_value);
return return_value;
}

/**
* Returns last error code
*/
function LMSGetLastError()
{
if (_DEBUG) console.log("GetLastError: "+myErrorNumber);
return myErrorNumber;
}

/**
* Returns the errorNumber error description
*/
function LMSGetErrorString(errorNumber)
{
if (_DEBUG) console.log("GetErrorString");
return myGetErrorString(errorNumber);
}

/**
* Returns an comprehensive description od the errorNumber error.
*/
function LMSGetDiagnostic(errorNumber)
{
if (_DEBUG) console.log("LMSGetDiagnostic with errorNumber: "+errorNumber);

if (errorNumber == "") {
    return myErrorDiagnostic;
} else {
    return myGetDiagnostic(errorNumber);
}
}


/*
########################## my* Function ##############################

These functions implement the actual functionality of the corresponding LMS
functions. Initially, each function checks the LMS state. Possible states are
"Not started", "Started", "Finished", each with different valid function calls.

#########################################################################
*/

/**
* LMS initialization. Sets the LMS state (myCurrentState) to 0 (Started).
* The only valid parameter is "". Returns true/false.
*/
function myInitialize(parameter)
{
return_value = "false";

if (parameter != '')
{
    throw new myError ('201', 'Non-Empty parameter');
}

if (myCurrentState != -1 & myCurrentState != 1)
{
    throw new myError('101', 'LMS not initialized');
}
else
{
    myCurrentState = 0;
    return_value  = "true";
}

return return_value;
}

/**
* LMS finalization. It sets the LMS state to 1 (Finished).
* The only valid parameter is "". It returns true/false
*/
function myFinish(parameter)
{
return_value = "false";


if (parameter != '')
{
    throw new myError ('201', 'Non-Empty parameter');
}

if (myCurrentState != 0 && myCurrentState != 1)
{
    throw new myError('301', 'LMS not initialized');
}
else
{
    /*1. Set cmi.core.lesson_status*/
    if (!(SCOState.lesson_status))
    {
        if (SCOState.masteryscore)
        {
            if (cmi.core.score.raw.get() < SCOState.masteryscore)
            {
                SCOState.lesson_status = 'failed';
                cmi.core.lesson_status.set('failed');
            }
            else
            {
                SCOState.lesson_status = 'passed';
                cmi.core.lesson_status.set('passed');
            }
        }
        else
        {
            SCOState.lesson_status = 'completed';
            cmi.core.lesson_status.set('completed');
        }
    }

    /*2. Set cmi.core.entry.*/
    var exit = SCOState.scorm_exit;
    switch (exit)
    {
        case 'time-out':
            SCOState.entry = '';
            break;
        case 'suspend':
            SCOState.entry = 'resume';
            break;
        case 'logout':
            SCOState.entry = '';
            break;
        case '':
            SCOState.entry = '';
            break;
        default:
            SCOState.entry = '';
            break;
    }

    myCommit('finish');
    myCurrentState = 1;
    return_value  = "true";
}



return return_value;
}

/**
* Returns the "property" value, or false if an error occurs
*/
function myGetValues(property)
{
var return_value = "";
try {
    checkState();
    property = checkParameter(property);
    eval('return_value = ' + property + '.get()');
} catch (e) {
    myErrorHandler(e);
} 
return return_value;
}

/**
* Sets "property" value to "value". Returns true/false
*/
function mySetValues(property, value)
{

var return_value = "false";

try {
    checkState();
    property = checkParameter(property);
    eval('return_value = ' + property + '.set(value)');
} catch (e) {
    myErrorHandler(e);
} 
return return_value;
}

/**
* Orders LMS to persist all parameter values
* Only valid argument is "". It returns true/false.
*/
function myCommit(parameter)
{
var return_value = "false";

if (parameter != '' && parameter != 'finish')                                   //'finish' parameter indicates that myCommit was called from myFinish, so it may persist total_time as well
{
    myErrorHandler(new myError('201', 'Non-Empty parameter'));
    return return_value;
}
else
{
    try {
        checkState();
        /*Are we going to store any data;*/
        SCOState.credit = cmi.core.credit.get();
        //commitParameters = '';
        /*SCOState holds the variables that need to be commited. These become a series of GET parameters, which are communicated to the LMSCommitPage.php page*/
        
        //console.log(cmi.interactions);

        SCOState.interactions = new Array();
        for (var i = 0; i < cmi.interactions.length; i++) {
            SCOState.interactions[i] = {
                    "id":cmi.interactions[i].id.value,
                    "latency":cmi.interactions[i].latency.value,
                    "result":cmi.interactions[i].result.value,
                    "student_response":cmi.interactions[i].student_response.value,
                    "time":cmi.interactions[i].time.value,
                    "type":cmi.interactions[i].type.value,
                    "weighting":cmi.interactions[i].weighting.value,
                    //"correct_responses":cmi.interactions[i].correct_responses.value,
                    }; 
            SCOState.interactions[i].correct_responses = new Array();
            for (var j = 0; j < cmi.interactions[i].correct_responses.length; j++) {
                SCOState.interactions[i].correct_responses[j] = {"pattern" : cmi.interactions[i].correct_responses[j].pattern.value};
            }
        }
//            console.log(SCOState);
        commitState = $.extend({}, SCOState);	//make a copy of the object, so we can unset the session_time if we're not finished
        if (parameter != 'finish') {
            delete commitState.session_time;		 //if we're not finishing, then don't send a session_time value
        }

        if(commitState.lesson_status == 'browsed'){ // we have to translate browsed to incomplete since we do not handle browsed in the backend
            commitState.lesson_status = 'incomplete';
        }

        // Notify mobile clients of updates, when the unit is viewed in "compatibility mode".
        if(typeof(JSInterface) != 'undefined' && typeof(JSInterface.commit) != 'undefined'){
            JSInterface.commit(JSON.stringify(commitState));
        }
        var ss=SCOState;
        //scormPost(commitState);
        
        return_value = "true";
    } catch (e) {
        myErrorHandler(e);
    } 
    return return_value;
}
}

function handleCommit(transport) {
/*	
if (!(w = findFrame(top, 'mainframe'))) {
    if (window.opener && window.opener.updateProgress) {
        w = window.opener;
    } else {
        w = window;
    }
}

w.updateProgress(transport.responseText.evalJSON(true));

if (transport.responseText.evalJSON(true)[4]) {
    w.location = transport.responseText.evalJSON(true)[4];
}
*/	
}

/**
* Returns the message that corresponds to errrorNumber.
*/
function myGetErrorString(errorNumber)
{
var errorStrings    = new Array();
errorStrings['0']   = 'No Error';
errorStrings['101'] = 'General exception';
errorStrings['201'] = 'Invalid argument error';
errorStrings['202'] = 'Element cannot have children';
errorStrings['203'] = 'Element not an array - cannot have count';
errorStrings['301'] = 'Not initialized';
errorStrings['401'] = 'Not implemented error';
errorStrings['402'] = 'Invalid set value, element is a keyword';
errorStrings['403'] = 'Element is read only';
errorStrings['404'] = 'Element is write only';
errorStrings['405'] = 'Incorrect Data Type';

if (errorNumber == '') {                                                    //No arguments were given, so no error is reported (this is basically to comply with the case where the function is called before LMSInitialize())
    return '';
} else if ((typeof errorStrings[errorNumber]) == 'undefined') {             //If the error code is not valid, do nothing really
    return errorStrings[0];
} else {
    return errorStrings[errorNumber];
}

}

/**
* Returns a custom message that corresponds to errorNumber, or the message that corresponds to the current error, if the argument is "".
*/
function myGetDiagnostic(errorNumber)
{
var errorDiagnostic    = new Array();
errorDiagnostic["0"]   = 'Succesful operation. There were no errors';
errorDiagnostic['101'] = 'A general fault occured - General exception';
errorDiagnostic['201'] = 'You cannot set such value - Invalid argument error';
errorDiagnostic['202'] = 'This element cannot have children - Element cannot have children';
errorDiagnostic['203'] = 'This element is not an array - Element not an array - cannot have count';
errorDiagnostic['301'] = 'System has to be initialized - Not initialized';
errorDiagnostic['401'] = 'This property is not implemented - Not implemented error';
errorDiagnostic['402'] = 'You cannot set a value to a keyword - Invalid set value, element is a keyword';
errorDiagnostic['403'] = 'You can only read this element\'s value - Element is read only';
errorDiagnostic['404'] = 'You can only write this element\'s value - Element is write only';
errorDiagnostic['405'] = 'You cannot set this element to this value - Incorrect Data Type';

if (errorNumber == "") errorNumber = myErrorNumber;

return errorDiagnostic[errorNumber];
}


/*
######################## Supplementary functions #########################

These functions implement supplementary operations needed by the LMS. They
are mainly associated to error handling.

#########################################################################
*/

/**
* Checks the LMS state. If it is other than 0, it means it is not initialized, so an error is fired.
*/
function checkState()
{
if (myCurrentState != 0)
{
    throw new myError('301');
}
}

/**
* Checks id the specified parameter is implemented
*/
function checkParameter(property)
{
/*The code below is used to handle strings of the form "cmi.interactions.1.objectives.0.id" */
str = property;
str_split = property.split(".");

if (typeof str_split[1] !== 'undefined' && str_split[1] == 'objectives') {
    throw new myError('401');
}

if (!isNaN(parseInt(str_split[2])))
{
    k = 3;      //k is used to discriminate cmi.interactions.1.objectives.0.id from cmi.interactions.1.id
    str = str_split[0]+'.'+str_split[1]+'['+str_split[2]+']';
    /*If the objext is already defined, do not define it again*/

    if (eval('typeof '+str_split[0]+'.'+str_split[1]) == 'undefined')
    {
        throw new myError('201');
    }
    _TEMP = str_split[2];                                                       //This is used to signify globally the current index

    if (!(eval(str)))
    {
        var current_length = eval(str_split[0]+'.'+str_split[1]+'.length');     //Check if the siginified index is sequential (e.g. if the last array index is 3, the designated array index must be at most 4)
        if (str_split[2] > current_length)
        {
            throw new myError('201');
        }
        else
        {
            eval(str+'= new '+str_split[1]+'Object()');
        }
    }

    if (!isNaN(parseInt(str_split[4])))
    {
        if (eval('typeof '+str+'.'+str_split[3]) == 'undefined')
        {
            throw new myError('201');
        }
        _TEMP2 = str_split[4];                                                  //This is used to signify globally the current index

        var current_length = eval(str+'.'+str_split[3]+'.length');              //Check if the siginified index is sequential (e.g. if the last array index is 3, the designated array index must be at most 4)

        str+='.'+str_split[3]+'['+str_split[4]+']';

        if (str_split[4] > current_length)
        {
            throw new myError('201');
        }
        else
        {
            eval(str+'= new '+str_split[3]+'Object()');
        }
        k = 5;
    }

    for (var i = k; i < str_split.length; i++)
    {
        str += '.'+str_split[i];
    }

    property = str;
}

str_split    = property.split(".");
var temp_str = str_split[0];
for (var i = 1; i < str_split.length; i++) {
    if (eval('typeof ' + temp_str) == 'undefined') {
        throw new myError('201');
    }
    temp_str = temp_str + '.' + str_split[i];
}

/*Check if the parameter exists*/
if (property == null || eval('typeof '+property) == 'undefined')
{
    var last_element = str_split.pop();                         //Take the last element in the array
    if (last_element == '_children') {
        throw new myError('202');
    } else if (last_element == '_count') {
        throw new myError('203');
    } else {
        throw new myError('201');
    }
}

return property;
}

/**
* This function checks parameters against regular expressions to verify their compliance with the data model.
* Parameter is the string to check. data_model is the model to check the parameter against, i.e. CMIDecimal.
* type is an argument used only in cases where the data model can be one of a number of different enumerations.
*/
function checkDataType(parameter, data_model, type)
{
switch (data_model) {
    case 'CMIBlank':
        return match = /^$/.test(parameter);                        //empty string
        break;

    case 'CMIBoolean':
        return match = /^(true|false)$/.test(parameter);                //boolean, true or false
        break;

    case 'CMIDecimal':
        return match = /^-?\d+(\.\d+)?$/i.test(parameter);          //positive or negative number that may be decimal
        break;

    case 'CMIFeedback':
        switch (type) {
            case 'true-false':
                return match = /^(0|1|t|f)$/.test(parameter);                   // Can be one of: "0", "1", "t", "f"
                break;
            case 'choice':
                //return match = /^[a-z0-9](,[a-z0-9])*$/i.test(parameter);       //i.e. a,f,4,2,d		//Commented out because Articulate may send the whole word/sentence (more convenient)
                //return match = /^[\w\d\s]+(,[\w\d\s]+)*$/i.test(parameter);       //i.e. a,f,4,2,d
                return match = /^.{0,4096}$/i.test(parameter); //relaxing requirements, taken from e-front
                break;
            case 'fill-in':
                return match = /^\s*.[\s\S]{1,4096}$/i.test(parameter);                //Anything of up to 4096 characters, but the spaces before the first character won't count. Allow newlines
                break;
            case 'numeric':
                return match = /^-?\d+(\.\d+)?$/i.test(parameter);              //CMIDecimal
                break;
            case 'likert':
//                	return match = /^[0-9a-z]?$/i.test(parameter);                  //Single character or digit			//Commented out because Articulate may send the whole word/sentence (more convenient)
                return match = /^.{0,1024}$/i.test(parameter);
                break;
            case 'matching':
                return match = /^[a-z0-9].[a-z0-9](,[a-z0-9].[a-z0-9])*$/i.test(parameter);             //Pair of identifiers, i.e. 2.s,4.2
                break;
            case 'performance':
                return match = /^.{0,4096}$/i.test(parameter);                   //A string of at most 4096 characters
                break;
            case 'sequencing':
                return match = /^[a-z0-9](,[a-z0-9])*$/i.test(parameter);       //same as 'choice' above
                break;
            default:
                return false;
                break;
        }
        break;

    case 'CMIIdentifier':
        return match = /^[\s\w\-\.\(\)\,\:\;\+\%\']{1,1024}$/i.test(parameter); // Allow letters, spaces, numbers and some special chars[. ( ) , : ; + % ']. VIOLATING the protocol to accommodate shameful contents.
        break;

    case 'CMIInteger':
        return match = (/^[0-9]{1,5}$/i.test(parameter) && parameter <=65536);              //Integer less than or equal to 65536
        break;

    case 'CMISInteger':
        return match = (/^(\-|\+)?[0-9]{1,5}$/i.test(parameter) && parameter <= 32768 && parameter >= -32768);      //Signed integer ranging from -32768 to +32768
        break;

    case 'CMIString255':
        return match = /^(.|\n){0,255}$/i.test(parameter);               //Any character string with length at most 255
        break;

    case 'CMIString4096':
        //return match = /^.{0,4096}$/mi.test(parameter);              //Any character string with length at most 4096
        return match = /^.{0,65535}$/mi.test(parameter);              //By violation of the protocol, we set this to SCORM 2004's limit
        break;

    case 'CMITime':
        match = (/^(\d\d):(\d\d):(\d\d)(.\d{1,2})?$/i.exec(parameter));             //A point in a 24-hour clock, with an optional 1 or 2 digit decimal part in seconds
        if (match && match[1] < 24 && match[2] < 60 && match[3] < 60)
        {
            return true;
        }
        else
        {
            return false;
        }
        break;

    case 'CMITimespan':
        return match = /^\d{2,4}:\d\d:\d\d(.\d{1,2})?$/i.test(parameter);           //A timespan, in the form HHHH:MM:SS.SS
        break;

    case 'CMIVocabulary':
        switch (type) {
            case 'Mode':
                return match = /^(normal|review|browse)$/.test(parameter);
                break;
            case 'Status':
                return match = /^(passed|completed|failed|incomplete|browsed|not attempted)$/.test(parameter);
                break;
            case 'Exit':
                return match = /^(time-out|suspend|logout|^)$/.test(parameter);
                break;
            case 'Credit':
                return match = /^(credit|no-credit)$/.test(parameter);
                break;
            case 'Entry':
                return match = /^(ab-initio|resume|^)$/.test(parameter);
                break;
            case 'Interaction':
                return match = /^(true-false|choice|fill-in|matching|performance|likert|sequencing|numeric)$/.test(parameter);
                break;
            case 'Result':
                return match = /^(correct|wrong|unanticipated|neutral|(-?\d+(\.\d+)?))$/.test(parameter);
                break;
            case 'TimeLimitAction':
                return match = /^(exit,message|exit,no message|continue,message|continue,no message)$/.test(parameter);
                break;
            default:
                return false;
                break;
        }

    default:
        return false;
        break;
}

}

/**
* This function creates error objects
*/
function myError(errorNumber, errorMessage)
{
this.errorNumber = errorNumber;
this.errorMessage = errorMessage;
}

/**
* This function handles errors, by setting appropriate error messages and codes
*/
function myErrorHandler(err)
{
console.log(err);

if (err instanceof myError)
{
    myErrorNumber = err.errorNumber;
    if (err.errorMessage)
    {
        myErrorDiagnostic = err.errorMessage;
    }
    else
    {
        myErrorDiagnostic = myGetDiagnostic(err.errorNumber);
    }
}
else throw err;
}

/**
* Initializes error code and message
*/
function myInitError()
{
myErrorNumber = '0';
myErrorDiagnostic = myGetDiagnostic(myErrorNumber);
}

/*
######################### Data Model ####################################

The functions below implement the SCORM data model. Each function is
initialized to an object, so that data access is done accordingly to
SCORM notation. For example, if we need to set the cmi.core.student_name
parameter's value, we will access it at exactly the same way, since all
parameter elements (cmi, core, student_name) are objects.

#########################################################################
*/

/**
* Cmi data model
*/
function myCmi()
{
/**
* cmi.core is made of objects which all SCOs depend on and all LMSs must implement
*/
this.core = new function()
{
    /**
    * cmi.core._children is a string that contains all the elements the LMS supports
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: YES
    * Data Type: CMIString255
    * Read Only
    *
    * Initialization: All LMS children, so that an LMSGetValue call will return a comma separated list
    */
    var _children = function()
    {
        this.value = 'student_id, student_name, lesson_location, credit, lesson_status, entry, score, total_time, lesson_mode, exit, session_time';

        this.get = function()      { return this.value;           };
        this.set = function(param) { throw new myError('402'); };
    };

    /**
    * cmi.core.student_id is an identifier that contains the user (student) id.
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: YES
    * Data Type: CMIIdentifier
    * Read Only
    *
    * Initialization: LMS sets it to the user id.
    */
    var student_id = function()
    {
        this.value = tl_sco_data.student_id;

        this.get = function()      { return this.value;           };
        this.set = function(param) { throw new myError('403'); };
    };

    /**
    * cmi.core.student_name is the user full name
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: YES
    * Data Type: CMIString255
    * Read Only
    *
    * Initialization: LMS sets it to the user full name
    */
    var student_name = function()
    {
        this.value = tl_sco_data.student_name;
        
        this.get = function()      { return this.value;           };
        this.set = function(param) { throw new myError('403'); };
    };

    /**
    * cmi.core.lesson_location is the point where the user left to SCO. The LMS must store this value and return
    * it to the SCO when the user returns, if the SCO asks for it
    *
    * Supported API calls: LMSGetValue(), LMSSetValue()
    * LMS Mandatory: YES
    * Data Type: CMIString255
    * Read / Write
    *
    * Initialization: LMS sets it to ''. Using it is SCO responsibility.
    */
    var lesson_location = function()
    {
        this.value = '';

        this.get = function()
        {
            if (typeof SCOState.lesson_location != 'undefined')
            {
                this.value = SCOState.lesson_location;
            }
            return this.value;
        };
        this.set = function(param)
        {
            if (!checkDataType(param, 'CMIString255', false))
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                SCOState.lesson_location = this.value;

                return "true";
            }
        };
    };

    /**
    * cmi.core.credit siginifies whether the user is beeing tracked by the LMSduring this SCO.
    * That is, it sets whether the SCO will send data to the LMS, which will be stored
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: YES
    * Data Type: CMIVocabulary "credit" , "no-credit"
    * Read Only
    *
    * Initialization: LMS responsibility.
    */
    var credit = function()
    {
        this.value = 'credit';

        this.get = function()
        {
            return this.value;
        };
        this.set = function(param) { throw new myError('403'); };
    };

    /**
    * cmi.core.lesson_status is the user's status
    *
    * Supported API calls: LMSGetValue(), LMSSetValue()
    * LMS Mandatory: YES
    * Data Type: CMIVocabulary 'passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'
    * Read / Write
    *
    * Initialization: LMS responsibility.
    */
    var lesson_status   = function()
    {
        this.value = 'not attempted';
        //allowable values : 'passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'

        this.get = function()
        {
            if (SCOState.lesson_status)
            {
                this.value = SCOState.lesson_status;
            }
            return this.value;
        };
        this.set = function(param)
        {
            count = 0;

            if (!checkDataType(param, 'CMIVocabulary', 'Status') || param == 'not attempted')
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                SCOState.lesson_status = this.value;
                return "true";
            }
        };

    };

    /**
    * cmi.core.entry siginfies whether the user has previously visited this SCO
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: YES
    * Data Type: CMIVocabulary "ab-initio" , "resume", ""
    * Read Only
    *
    * Initialization: LMS responsibility.
    */
    var entry = function()
    {
        this.value = 'ab-initio';
        
        this.get = function()
        {
            if ((typeof SCOState.entry) != 'undefined')                          //Since entry may be just '', we need to check if it is defined
            {
                this.value = SCOState.entry;
            }
            return this.value;
        };
        this.set = function(param) { throw new myError('403'); };
    };

    /*User's performance*/
    var score = function()
    {
        /**
        * cmi.core.score._children is a string that lists all the elements supported by cmi.core.score
        *
        * Supported API calls: LMSGetValue()
        * LMS Mandatory: YES
        * Data Type: CMIString255
        * Read Only
        *
        * Initialization: All the score's children, so that an LMSGetValue call returns a comma-separated list
        */
        var _children = function()
        {
            this.value = 'raw,min,max';
            
            this.get = function()      { return this.value;            };
            this.set = function(param) { throw new myError('402'); };
        };

        /**
        * cmi.core.score.raw is the user's performance in this SCO, and it is represented as number ranging from 0 to 100
        *
        * Supported API calls: LMSGetValue(), LMSSetValue()
        * LMS Mandatory: YES
        * Data Type: CMIDecimal or CMIBlank
        * Read / Write
        *
        * Initialization: The empty string ''
        */
        var raw = function()
        {
            if (SCOState.score){
                this.value = SCOState.score;
            }
            else{
                this.value = '';
            }
            
            this.get = function() { return this.value; };
            this.set = function(param)
            {
                if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false))
                {
                    throw new myError('405');
                }
                else
                {
                    this.value = param;
                    SCOState.score = this.value;
                    return "true";
                }
            };
        };

        /**
        * cmi.core.score.max is the user's maximum possible score
        *
        * Supported API calls: LMSGetValue(), LMSSetValue()
        * LMS Mandatory:
        * Data Type: CMIDecimal or CMIBlank
        * Read / Write
        *
        * Initialization: The emtpy string ''
        */
        var max = function()
        {
            this.value = '';
            
            this.get = function()      { return this.value; };
            this.set = function(param)
            {
                if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false))
                {
                    throw new myError('405');
                }
                else
                {
                    this.value = param;
                    SCOState.maxscore = this.value;
                    return "true";
                }
            };
        };

        /**
        * cmi.core.score.is the user's minimum possible score
        *
        * Supported API calls: LMSGetValue(), LMSSetValue()
        * LMS Mandatory:
        * Data Type: CMIDecimal or CMIBlank
        * Read / Write
        *
        * Initialization: The empty string ''
        */
        var min = function()
        {
            this.value = '';
            this.get = function()      { return this.value; };
            this.set = function(param)
            {
                if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false))
                {
                    throw new myError('405');
                }
                else
                {
                    this.value = param;
                    SCOState.minscore = this.value;
                    return "true";
                }
            };
        };

        this._children = new _children();
        this.raw       = new raw();
        this.max       = new max();
        this.min       = new min();
    };

    /**
    * cmi.core.total_time is the total (cumulative) time that the user has spent on this SCO. The time is of the form HHHH:MM:SS.SS
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: YES
    * Data Type: CMITimeSpan
    * Read Only
    *
    * Initialization: To 0000:00:00.00
    */
    var total_time = function()
    {
        this.value = '0000:00:00.00';

        this.get = function()
        {
            if (SCOState.total_time)
            {
                this.value = SCOState.total_time;
            }

            return this.value;
        };
        this.set = function(param) { throw new myError('403'); };
    };

    /**
    * cmi.core.lesson_mode is the SCO status.
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: No
    * Data Type: CMIVocabulary "browse", "normal", "review"
    * Read Only
    *
    * Initialization: To normal
    */
    var lesson_mode = function()
    {
        this.value = 'normal';
        //allowable values : 'browse', 'normal', 'review'
        
        this.get = function()
        {
            if (SCOState.lesson_mode)
            {
                this.value = SCOState.lesson_mode;
            }
            return this.value;
        };
        this.set = function(param) { throw new myError('403'); };

    };

    /**
    * cmi.core.exit siginfies how or why the user left the SCO.
    *
    * Supported API calls: LMSSetValue()
    * LMS Mandatory: YES
    * Data Type: CMIVocabulary "time-out", "suspend", "logout", ""
    * Write Only
    *
    * Initialization: Not needed
    */
    var exit = function()
    {
        this.value = '';
        //var legal_values = new Array('time-out', 'suspend', 'logout', '');
        //allowable values : 'time-out', 'suspend', 'logout', ''
        
        this.get = function()      { throw new myError('404'); };
        this.set = function(param)
        {
            count = 0;

            if (!checkDataType(param, 'CMIVocabulary', 'Exit'))
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                SCOState.scorm_exit = this.value;
                return "true";
            }
        };
    };

    /**
    * cmi.core.session_time is the time the user has spent on this SCO during this session (opposed to total_time).
    *
    * Supported API calls: LMSSetValue()
    * LMS Mandatory: YES
    * Data Type: CMITimespan
    * Write Only
    *
    * Initialization: To 0000:00:00.00
    */
    var session_time = function()
    {
        this.value = '';

        this.get = function()      { throw new myError('404'); };
        this.set = function(param)
        {
            if (!checkDataType(param, 'CMITimespan', false))
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                SCOState.session_time = this.value;
                return "true";
            }
        };
    };

    this._children       = new _children();
    this.student_id      = new student_id();
    this.student_name    = new student_name();
    this.lesson_location = new lesson_location();
    this.credit          = new credit();
    this.lesson_status   = new lesson_status();
    this.entry           = new entry();
    this.score           = new score();
    this.total_time      = new total_time();
    this.lesson_mode     = new lesson_mode();
    this.exit            = new exit();
    this.session_time    = new session_time();
};

/**
* cmi.suspend_data contains general information that the SCO wishes to store to the LMS. These must
* be made available on restart
*
* Supported API calls: LMSGetValue(), LMSSetValue()
* LMS Mandatory: YES
* Data Type: CMIString4096
* Read / Write
*
* Initialization: To ''
*/
this.suspend_data = new function()
{
    this.value = '';

    this.get = function()
    {
        if (SCOState.suspend_data)
        {
            this.value = SCOState.suspend_data;
        }

        return this.value;
    };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIString4096', false))
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            SCOState.suspend_data = this.value;
            return "true";
        }
    };
};

/**
* cmi.launch_data contains general information which are needed when a SCO starts.
* LMS reads these information from the "adlcp:datafromlms" manifest field
*
* Supported API calls: LMSGetValue()
* LMS Mandatory: YES
* Data Type: CMIString4096
* Read Only
*
* Initialization: To ''
*/
this.launch_data = new function()
{
    this.value = '';
    this.get = function()
    {
        if (SCOState.datafromlms)
        {
            this.value = SCOState.datafromlms;
        }

        return this.value;
    };
    this.set = function(param) { throw new myError('403'); };
};

/**
* cmi.comments is used in order for the user to be able to send comments to the LMS regarding this SCO.
*
* Supported API calls: LMSGetValue(), LMSSetValue()
* LMS Mandatory: NO
* Data Type: CMIString4096
* Read / Write
*
* Initialization: To ''
*/
this.comments = new function()
{
    this.value = '';
    
    this.get = function()      { return this.value; };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIString4096', false))
        {
            throw new myError('405');
        }
        else
        {
            this.value += param;
            SCOState.comments = this.value;
            return "true";
        }
    };
};

/**
* cmi.comments_from_lms is used from the user in order for him to see the user-defined comments set for this SCO
*
* Supported API calls: LMSGetValue()
* LMS Mandatory: NO
* Data Type: CMIString4096
* Read Only
*
* Initialization: To ''
*/
this.comments_from_lms = new function()
{
    this.value = '';
    
    this.get = function()
    {
        if (SCOState.comments_from_lms)
        {
            this.value = SCOState.comments_from_lms;
        }
        return this.value;
    };
    this.set = function(param) { throw new myError('403'); };
};

/*
* It may adjust SCO depending on user performance
*/
this.student_data = new function()
{
    /**
    * cmi.student_data._children is a string that contains a list of all the elements supported by cmi.student_data
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: NO
    * Data Type: CMIString255
    * Read Only
    *
    * Initialization: All the element's children, so that a LMSGetValue returns a comme-separated list
    */
    var _children = function()
    {
        this.value = 'mastery_score,max_time_allowed,time_limit_action';
        
        this.get = function()      { return this.value;            };
        this.set = function(param) { throw new myError('402'); };
    };

    /**
    * cmi.student_data.mastery_score is the score that the user must succeed in order to pass the unit succesfully
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: NO
    * Data Type: CMIDecimal
    * Read Only
    *
    * Initialization: Set by the LMS
    */
    var mastery_score = function()
    {
        this.value = '';

        this.get = function()
        {
            if (SCOState.masteryscore)
            {
                this.value = SCOState.masteryscore;
            }
            return this.value;
        };
        this.set = function(param) { throw new myError('403'); };
    };

    /**
    * cmi.student_data.max_time_allowed is the maximum time available to the user, in order for him to finish the unit
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: NO
    * Data Type: CMITimespan
    * Read Only
    *
    * Initialization: Set by the LMS
    */
    var max_time_allowed = function()
    {
        this.value = '';

        this.get = function()
        {
            if (SCOState.maxtimeallowed)
            {
                this.value = SCOState.maxtimeallowed;
            }
            return this.value;
        };
        this.set = function(param) { throw new myError('403'); };
    };

    /**
    * cmi.student_data.time_limit_action is the action that will be performed when the user's available time is up
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: NO
    * Data Type: CMIVocabulary 'exit,message', 'exit,no message', 'continue,message', 'continue,no message'
    * Read Only
    *
    * Initialization: Set by the LMS
    */
    var time_limit_action = function()
    {
        this.value = '';
        //legal values = 'exit,message', 'exit,no message', 'continue,message', 'continue,no message'
        
        this.get = function()
        {
            if (SCOState.timelimitaction)
            {
                this.value = SCOState.timelimitaction;
            }
            return this.value;
        };
        this.set = function(param) { throw new myError('403'); };
    };

    this._children         = new _children();
    this.mastery_score     = new mastery_score();
    this.max_time_allowed  = new max_time_allowed();
    this.time_limit_action = new time_limit_action();
};

/*Options that may be needed in SCOs*/
this.student_preference = new function()
{
    /**
    * cmi.student_preference._children is a string containing a list of all the elements supported by cmi.student_preference
    *
    * Supported API calls: LMSGetValue()
    * LMS Mandatory: NO
    * Data Type: CMIString255
    * Read Only
    *
    * Initialization: All the element's children, so that a LMSGetValue call returns a comma-separated list
    */
    var _children = function()
    {
        this.value = 'language,speech,audio,speed,text';
        
        this.get = function()      { return this.value;            };
        this.set = function(param) { throw new myError('402'); };
    };

    /**
    * cmi.student_preference.audio sets the audio volume
    *
    * Supported API calls: LMSGetValue(), LMSSetValue()
    * LMS Mandatory: NO
    * Data Type: CMIInteger
    * Read / Write
    *
    * Initialization: Set by the LMS to 0
    */
    var audio = function()
    {
        this.value = '';

        this.get = function()      { return this.value; };
        this.set = function(param)
        {
            if (!checkDataType(param, 'CMISInteger', false) || param < -1 || param > 100)
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                return "true";
            }
        };
    };

    /**
    * cmi.student_preference.language Sets the user preferable language
    *
    * Supported API calls: LMSGetValue(), LMSSetValue()
    * LMS Mandatory: NO
    * Data Type: CMIString255
    * Read / Write
    *
    * Initialization: Set by the LMS to ''
    */
    var language = function()
    {
        this.value = 'english';

        this.get = function()       { return this.value; };
        this.set = function(param)
        {
            if (!checkDataType(param, 'CMIString255', false))
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                return "true";
            }
        };
    };

    /**
    * cmi.student_preference.speed sets the content rate
    *
    * Supported API calls: LMSGetValue(), LMSSetValue()
    * LMS Mandatory: NO
    * Data Type: CMISInteger
    * Read / Write
    *
    * Initialization: Set by the LMS to ''
    */
    var speed = function()
    {
        this.value = '0';

        this.get = function()      { return this.value; };
        this.set = function(param)
        {
            if (!checkDataType(param, 'CMISInteger', false) || param < -100 || param > 100)
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                return "true";
            }
        };
    };

    /**
    * cmi.student_preference.text Sets whether the audio is accompanied by text also
    *
    * Supported API calls: LMSGetValue(), LMSSetValue()
    * LMS Mandatory: NO
    * Data Type: CMISInteger
    * Read / Write
    *
    * Initialization: Set by the LMS to ''
    */
    var text = function()
    {
        this.value = '0';

        this.get = function()      { return this.value; };
        this.set = function(param)
        {
            if (!checkDataType(param, 'CMISInteger', false) || (param != "1" && param != "0" && param != "-1"))
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                return "true";
            }
        };
    };

    this._children = new _children();
    this.audio     = new audio();
    this.language  = new language();
    this.speed     = new speed();
    this.text      = new text();
};

/*
* Signifies the accomplishment level of the user to the SCO objectives
*/
var objectives = new Array();

/**
* cmi.objectives._children is a string containing a list of all the elements supported by cmi.objectives
*
* Supported API calls: LMSGetValue()
* LMS Mandatory: NO
* Data Type: CMIString255
* Read Only
*
* Initialization: A comma-spearated list of elements
*/
objectives._children = new function()
{
    this.value = 'id,score,status';

    this.get = function()      { return this.value;            };
    this.set = function(param) { throw new myError('402'); };
};

/**
* cmi.objectives._count The number of entries currently in the cmi.objectives list
*
* Supported API calls: LMSGetValue()
* LMS Mandatory: NO
* Data Type: CMIString255
* Read Only
*
* Initialization: Total number of entries
*/
objectives._count = new function()
{
    this.get = function()      { return cmi.objectives.length; };
    this.set = function(param) { throw new myError('402'); };
};

//Assign objectives to cmi object
this.objectives = objectives;


/**
* cmi.interactions handles user-defined data
*/
var interactions = new Array();

/**
* cmi.interactions._children is a string containing the elements supported by cmi.interactions
*
* Supported API calls: LMSGetValue()
* LMS Mandatory: NO
* Data Type: CMIString255
* Read Only
*
* Initialization: A comma-separated list of elements
*/
interactions._children = new function()
{
    this.value = 'id,objectives,time,type,correct_responses,weighting,student_response,result,latency';

    this.get = function()      { return this.value;            };
    this.set = function(param) { throw new myError('402'); };
};

/**
* cmi.interactions._count contains the number of entries currently in cmi.interactions
*
* Supported API calls: LMSGetValue()
* LMS Mandatory: NO
* Data Type: CMIInteger
* Read Only
*
* Initialization: The total number of entries
*/
interactions._count = new function()
{
    this.get = function()      { return cmi.interactions.length; };
    this.set = function(param) { throw new myError('402'); };
};

//Assign interactions to cmi object
this.interactions = interactions;

};   //end of cmi

objectivesObject = function()
{
this.value = null;

this.id = new function()
{
    this.get = function()
    {
        if (this.value === null)         //means that is not initialized yet
        {
            this.value = '';             //Return empty string and throw error
            throw new myError('201');
        }
        return this.value;
    };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIIdentifier', false))
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            return "true";
        }
    };
};

this.score = new function()
{
    this._children = new function()
    {
        this.value = 'raw,min,max';

        this.get = function()      { return this.value;            };
        this.set = function(param) { throw new myError('402'); };
    };
    this.raw = new function()
    {
        this.value = '';

        this.get = function() { return this.value; };
        this.set = function(param)
        {
            if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false))
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                SCOState.score = this.value;
                return "true";
            }
        };
    };

    this.max = new function()
    {
        this.value = '';

        this.get = function()      { return this.value; };
        this.set = function(param)
        {
            if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false))
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                SCOState.maxscore = this.value;
                return "true";
            };
        };
    };

    this.min = new function()
    {
        this.value = '';

        this.get = function()      { return this.value; };
        this.set = function(param)
        {
            if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false))
            {
                throw new myError('405');
            }
            else
            {
                this.value = param;
                SCOState.minscore = this.value;
                return "true";
            }
        };
    };
};

this.status = new function()
{
    this.value        = 'not attempted';
    //var legal_values = new Array('passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted');

    this.get = function()
    {
        if (SCOState.lesson_status == 'passed' || SCOState.lesson_status == 'failed' || SCOState.lesson_status == 'completed')
        {
            this.value = SCOState.lesson_status;
        }
        return this.value;
    };
    this.set = function(param)
    {
        count = 0;

        if (!checkDataType(param, 'CMIVocabulary', 'Status'))
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            if (SCOState.lesson_status == 'not attempted') {        //meaning that the SCO doesn't manipulate the lesson_status parameter at all
                SCOState.lesson_status = this.value;
            }
            return "true";
        }
    };
};
};

interactionsObject = function()
{
this.id = new function()
{
    this.value = '';

    this.get = function()      { throw new myError('404'); };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIIdentifier', false))
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            return "true";
        }
    };
};

var objectives = new Array();

objectives._count = new function()
{
//  this.get = function()      { return 1000; }
    this.set = function(param) { throw new myError('402'); };
};
objectives._count.get = function()     { return objectives.length; };
this.objectives = objectives;

this.time = new function()
{
    this.value = '';

    this.get = function()      { throw new myError('404'); };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMITime', false))            //edw 8elei ena RE
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            return "true";
        }
    };
};

this.type = new function()
{
    this.value = '';

    this.get = function()      { throw new myError('404'); };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIVocabulary', 'Interaction'))
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            return "true";
        }
    };

    this.getValue = function() {
        return this.value;
    };

};

var correct_responses = new Array();

correct_responses._count = new function()
{
//  this.get = function()      { return cmi.objectives.length; }
    this.set = function(param) { throw new myError('402'); };
};

correct_responses._count.get = function()      { return correct_responses.length; };
this.correct_responses = correct_responses;

this.weighting = new function()
{
    this.value = '';

    this.get = function()      { throw new myError('404'); };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIDecimal', false))         //edw 8elei ena RE
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            return "true";
        }
    };

};

this.student_response = new function()
{
    this.value = '';

    this.get = function()      { throw new myError('404'); };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIFeedback', cmi.interactions[_TEMP].type.getValue()))
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;                
            return "true";
        }
    };

};

this.result = new function()
{
    this.value = '';

    this.get = function()      { throw new myError('404'); };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIVocabulary', 'Result'))           //edw 8elei ena RE
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            return "true";
        }
    };

};

this.latency = new function()
{
    this.value = '';

    this.get = function()      { throw new myError('404'); };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMITimespan', false))            //edw 8elei ena RE
        {
            throw new myError('405');;
        }
        else
        {
            this.value = param;
            return "true";
        }
    };

};

};

correct_responsesObject = function()
{

this.pattern = new function()
{
    this.value = '';

    this.get = function()      { throw new myError('404'); };
    this.set = function(param)
    {
        if (!checkDataType(param, 'CMIFeedback', cmi.interactions[_TEMP].type.getValue()))
        {
            throw new myError('405');
        }
        else
        {
            this.value = param;
            return "true";
        }
    };

};
};