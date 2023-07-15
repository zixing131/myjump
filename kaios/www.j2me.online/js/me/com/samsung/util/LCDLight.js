<!DOCTYPE html>
<head>
	<title>j2me.online</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
	<link rel="stylesheet" type="text/css" href="css/buttons.css">
	<link rel="stylesheet" type="text/css" href="css/emulator.css">
	<script>
    window.require=window.top.require
    window.Buffer=window.top.Buffer
  </script>
	<!-- <script src="js/eruda.js"></script> -->
	<!-- <script>eruda.init();</script> -->
	<script type="text/javascript" src="js/recycle-canvas.js"></script>
	<script type="text/javascript" src="js/hidpi-canvas.js"></script>
	<script type="text/javascript" src="js/pep.js"></script>
	<script type="text/javascript" src="js/png/crc-32.js"></script>
	<script type="text/javascript" src="js/png/png-chunks.js"></script>
	<script type="text/javascript" src="js/zip/zip.js"></script>
	<script type="text/javascript" src="js/zip/inflate.js"></script>
	<script type="text/javascript" src="js/zip/zip-ext.js"></script>
	<script type="text/javascript" src="js/js2me.js"></script>
	<script type="text/javascript" src="js/bufferStream.js"></script>
	<script type="text/javascript" src="js/convert.js"></script>
	<script type="text/javascript" src="js/classes.js"></script>
	<script type="text/javascript" src="js/file.js"></script>
	<script type="text/javascript" src="js/emulator.js"></script>
	<script type="text/javascript" src="js/execute.js"></script>
	<script type="text/javascript" src="js/events.js"></script>
	<script type="text/javascript" src="js/manifest.js"></script>
	<script type="text/javascript" src="js/methodStub.js"></script>
	<script type="text/javascript" src="js/launcher.js"></script>
	<script type="text/javascript" src="js/loader.js"></script>
	<script type="text/javascript" src="js/numbers.js"></script>
	<script type="text/javascript" src="js/jsbn.js"></script>
	<script type="text/javascript" src="js/numbers-fix.js"></script>
	<script type="text/javascript" src="js/resources.js"></script>
	<script type="text/javascript" src="js/threads.js"></script>
	<script type="text/javascript" src="js/workers.js"></script>
	<script type="text/javascript" src="js/buffer.js"></script>
	<script type="text/javascript" src="js/utils.js"></script>
</head>
<body>
	<div id="frame">
		<button class="topbutton" id="show" >
				&gt;
		</button>
		<div id="top">
			<button class="topbutton" id="hide">
				&lt;
			</button><div id="title">
			</div><button class="topbutton" id="exit">
				X
			</button>
		</div>
		<button class="topbutton" id="settings-button">i</button>
		<div id="screen">
		</div>
		<div id="keypad">
			<div id="joypad">
				<button id="up" class="key num">&nbsp;</button><br>
				<button id="left" class="key num">&nbsp;</button>
				<button id="ok" class="key num">&nbsp;</button>
				<button id="right" class="key num">&nbsp;</button><br>
				<button id="down" class="key num">&nbsp;</button>
			</div>


			<button id="choice" class="softkey">&nbsp;</button>
			<button id="open-joypad" class="key">⊹</button>
			<button id="back" class="softkey">&nbsp;</button><br>

			<button id="num1" class="key num">1</button>
			<button id="num2" class="key num">2</button>
			<button id="num3" class="key num">3</button><br>
			<button id="num4" class="key num">4</button>
			<button id="num5" class="key num">5</button>
			<button id="num6" class="key num">6</button><br>
			<button id="num7" class="key num">7</button>
			<button id="num8" class="key num">8</button>
			<button id="num9" class="key num">9</button><br>
			<button id="star" class="key num">*</button>
			<button id="num0" class="key num">0</button>
			<button id="pound" class="key num">#</button><br>
		</div>
	</div>
	<div id="alert">
		<div class="message">Error!</div>
	</div>
	<div id="settings">
		<div class="dialog">
			<div class="options">
				<div class="option">
					<label>Screen resolution (requires reload):</label>
					<select class="screen-size">
						<option value="128,128">128x128</option>
						<option value="176,220">176x220</option>
						<option value="240,320">240x320</option>
						<option value="320,640">320x640</option>
					</select>
				</div>
				<div class="option">
					<button class="generate-methods">Generate methods</button>
					<aside>May take long time</aside>
				</div>
			</div>
			<button class="done">Done</button>
		</div>
	</div>
	<script type="text/javascript" src="js/keepalive.js"></script>
</body>
