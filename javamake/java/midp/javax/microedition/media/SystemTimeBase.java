package javax.microedition.media;

class SystemTimeBase implements TimeBase {
    private static long offset = System.currentTimeMillis() * 1000;
 
    public long getTime() {
        return (System.currentTimeMillis() * 1000) - offset;
    }
}