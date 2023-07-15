(function () {
  // play audio to keepalive
  var publicPath = './';
  var TIMEOUT = 5000;
  var audio = new Audio;
  var vendor = navigator.vendor.toLowerCase();
  var ext;
  if (vendor.indexOf('google') >= 0 || (audio.canPlayType && audio.canPlayType('audio/ogg'))) {
    ext = 'ogg';
  } else if (vendor.indexOf('apple') >= 0 && audio.canPlayType('audio/flac')) {
    ext = 'flac';
  } else {
    ext = 'mp3';
  }
  audio.src = publicPath + 'static/keepalive.' + ext;
  audio.loop = true;
  audio.volume = 0;
  function onstop() {
    setTimeout(() => {
      audio.play();
    }, TIMEOUT);
  }
  audio.onpaste = onstop;
  audio.onended = onstop;
  audio.onerror = onstop;
  document.body.addEventListener('click', () => {
    audio.play();
  });
})();
