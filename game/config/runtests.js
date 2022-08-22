config.jars = "jar/jl.jar";
config.jad = "";
config.midletClassName = "GameMIDlet";

MIDlet.shouldStartBackgroundService = function() {
  return fs.exists("/startBackgroundService");
};
