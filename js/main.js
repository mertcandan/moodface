var limits = {
	'maxKerning': 10,
	'minKerning' : -15,
	'maxFontSize' : 72,
	'maxLeading' : 300,
	'minFontSize' : 12
}

var current = {
	'interval': 300,
	'kerning' : 1,
	'fontSize': 12,
	'avgInterval': 300,
	'letterCount': 0
}

var $lineCount = 0;
var $wordCount = 0;
var $word = '';
var $letterCount = 0;
var $deletedLetterCount = 0;

//keeps time
var lastTS = 0;
var interval = 0;

var labels = [
	{key: 300, value: 'very-fast'},
	{key: 500, value: 'fast'},
	{key: 800, value: 'moderate'},
	{key: 1000, value: 'slow'},
	{key: 2000, value: 'very-slow'}
];

var begin = false;

function process(timestamp) {

	if (lastTS === 0) {
		lastTS = timestamp;
	} else {
		current.interval = timestamp - lastTS;
        lastTS = timestamp;

        current.avgInterval = (current.avgInterval * current.letterCount + current.interval) / (current.letterCount + 1);
	}
}

var applyCurrents = function (kerning, fontSize) {

	styles = {
		'letter-spacing' : kerning,
		'font-size' : fontSize
	}

	$('#word' + $wordCount).children('#letter' + $letterCount).css(styles);
	$letterCount++;
}

function calculateKerning() {

	var ratio = current.interval / current.avgInterval; 

	if (current.kerning == 0)
		return 0.1;
	else
		return current.kerning / ratio;
}

function calculateFontSize() {
	//increase or decrease current.fontSize
	var ratio = current.interval / current.avgInterval;

	console.log(current.interval);
	console.log(ratio);

	return current.fontSize / ratio;
}

function calculateLeading() {
	return current.interval / 2000 * 30;
}

function adjustLetter() {
	//adjusts Kerning of the last letter
    //console.log(interval);
	
	//function for adjusting kerning value
	current.kerning = calculateKerning();

	//put an upper bound to kerning
	if (current.kerning > limits.maxKerning)
		current.kerning = limits.maxKerning;

	//put a lower bound to kerning
	if (current.kerning < limits.minKerning)
		current.kerning = limits.minKerning;

	//function for adjusting font size value
	current.fontSize = calculateFontSize();

	//put an upper bound for fontSize
	if (current.fontSize > limits.maxFontSize)
		current.fontSize = limits.maxFontSize;

	//put a lower bound for fontSize
	if (current.fontSize < limits.minFontSize)
		current.fontSize = limits.minFontSize;

	if (current.kerning > 8)
		applyCurrents(1 - current.kerning, current.fontSize);
	else
		applyCurrents(5 - current.kerning, current.fontSize);
}

function addWord(newline) {

	decideClassOfWord();
	decideClassOfLine();
	//adds a blank word container to the line
    $wordCount = $wordCount + 1;
    if (newline) {
    	$part = '<span id="word' + $wordCount + '" style="margin-left: 70px"></span>';
    }
    else {
    	$part = '<span id="word' + $wordCount + '" style="margin-left: 20px"></span>';
    }
	
	$('#line' + $lineCount).append($part);
	
	$word = '';
    $letterCount = 0;
}

function decideClassOfLine() {

	var max = 0;
	var result;
	var current;

	for (var i = 0; i < labels.length; i++) {

		current = $('#line' + $lineCount).children('.' + labels[i].value).length;

		if (current > max) {
			result = labels[i].value;
			max = current;
		}
	}

	$('#line' + $lineCount).removeClass().addClass(result);
}

function decideClassOfWord() {

	var max = 0;
	var result;
	var current;

	for (var i = 0; i < labels.length; i++) {

		current = $('#word' + $wordCount).children('.' + labels[i].value).length;

		if (current > max) {
			result = labels[i].value;
			max    = current;
		}
	}

	$('#word' + $wordCount).addClass(result);
}

function addLine(leading) {
	
	decideClassOfLine();
	//adds a new line to the text
	$lineCount = $lineCount + 1;
	if (leading != 0) {
		$('#text').append('<div style="height:' + leading + 'px; width:100%; clear:both;"></div>');
		//$('#line' + $lineCount).css('padding-top', leading);
	}
	$part = '<br><span id="line' + $lineCount + '"></span>';
	$('#text').append($part);

	addWord(true);
}

function decideClassOfLetter() {

	if ($deletedLetterCount > 0) {

		//random number needed [0-2]
		var rand = Math.floor(Math.random() * 3);

		$deletedLetterCount = $deletedLetterCount - 1;
		return "typo";
	}
	else {
		for (var i = 0; i < labels.length; i++) {

			if (current.interval < labels[i].key) {
				return labels[i].value;
			}
		}
	}
}

function addChar(letter) {

    $letter = '<span id="letter' + $letterCount + '" class=' + decideClassOfLetter() + '>' + letter + '</span>';
    $('#word' + $wordCount).append($letter);

    current.letterCount = current.letterCount + 1;
    $("html, body").animate({ scrollTop: $(document).height()}, 0);
}

//this has problems..
function deleteChar() {

	$deletedLetterCount = $deletedLetterCount + 1;
	//delete word element if no more letters left
	if ($letterCount == 0) {

		//$deletedLetterCount = 0;
		$('#word' + $wordCount).remove();
		$wordCount = $wordCount - 1;

		//delete line element if no more words left
		if ($wordCount == -1) {
			$('#line' + $lineCount).remove();
			$lineCount = $lineCount - 1;

			//re-calibrate wordCount
			$wordCount = $('#line' + $lineCount).children().length;
		}

		//remove last letter of previous word
		$letterCount = $('#word' + $wordCount).children().length;
	}

	$('#word' + $wordCount + ' #letter' + ($letterCount - 1)).remove();
	$letterCount = $letterCount - 1;

	current.letterCount = current.letterCount - 1;
}

var displayHUD = function () {

	$("#currentInterval").text(Math.round(current.interval * 100) / 100);
    $('#averageInterval').text(Math.round(current.avgInterval * 100) / 100);
    $('#letterCount').text(Math.round(current.letterCount * 100) / 100);
}

$('body').keypress(function(event) {

	if (begin === false) {
		begin = true;
		$('#start-prompt').hide();
	}

	process(event.timeStamp);

	if (current.interval > 2000) {
		
		leading = calculateLeading(current.interval);
		console.log(leading);

		if (leading > limits.maxLeading)
			leading = limits.maxLeading;
		
		current.interval = 300; //set interval to a reasonable value !!
		lastTS = 0; //experimental
		addLine(leading);
	}
	
	if (event.which == 13) { //enter key pressed

		leading = calculateLeading(current.interval);
		addLine(0);

	} else {

	    addChar(String.fromCharCode(event.which));
		$word = $word + String.fromCharCode(event.keyCode); //store the whole word for later use
	    
	    adjustLetter();
	    
		if (event.which == 32) { //space key is pressed
			
			addWord(false);
		}
	}

	displayHUD();
});

$('body').keydown(function (event) {
	
	//backspace keyCode is 8
	if(event.which == 8) {
		event.preventDefault();
		lastTS = 0;
		deleteChar();
	}
});

$('#reverse').click(function () {
	if ($('body').hasClass('inverted')) {
		$('#reverse').attr('src', '../img/invert_siyah.png');
		$('#save').attr('src', '../img/download_siyah.png');
		$('body').removeClass('inverted');
		$('#HUD').css("background", "#FEF991");
	} else {
		$('#reverse').attr('src', '../img/invert_beyaz.png');
		$('#save').attr('src', '../img/download_beyaz.png');
		$('body').addClass('inverted');
		$('#HUD').css("background", "black");
	}
});

$('#save').click(function () {
	window.print();
});