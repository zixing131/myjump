config.jars = "jar/Anyview4.0.jar";
config.jad = "jar/Anyview4.0.jad";
config.midletClassName = "com.ismyway.anyview.Anyview";

MIDlet.shouldStartBackgroundService = function() {
  return fs.exists("/startBackgroundService");
};
