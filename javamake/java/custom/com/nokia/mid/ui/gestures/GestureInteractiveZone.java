package com.nokia.mid.ui.gestures;

public class GestureInteractiveZone {
    public static final int GESTURE_TAP = 0x1;
    public static final int GESTURE_LONG_PRESS = 0x2;
    public static final int GESTURE_DRAG = 0x4;
    public static final int GESTURE_DROP = 0x8;
    public static final int GESTURE_FLICK = 0x10;
    public static final int GESTURE_LONG_PRESS_REPEATED = 0x20;
    public static final int GESTURE_PINCH = 0x40;
    public static final int GESTURE_DOUBLE_TAP = 0x80;
    public static final int GESTURE_RECOGNITION_START = 0x4000;
    public static final int GESTURE_RECOGNITION_END = 0x8000;
    public static final int GESTURE_ALL = 0xC0FF;

    int gestures;
    int x;
    int y;
    int endX;
    int endY;
    boolean rectSet = false;

    public GestureInteractiveZone(int gestures) throws IllegalArgumentException {
        this.gestures = gestures;
    }

    public GestureInteractiveZone(int gestures, int timeInterval) throws IllegalArgumentException {
        throw new RuntimeException("GestureInteractiveZone(II) not implemented (" + gestures + ", " + timeInterval + ")");
    }

    public void setRectangle(int x, int y, int width, int height) throws IllegalArgumentException {
        this.x = x;
        this.y = y;
        this.endX = x + width;
        this.endY = y + height;
        this.rectSet = true;
    }

    native public void setLongPressTimeInterval(int timeInterval) throws IllegalArgumentException;
    native public int getGestures();
    native public void setGestures(int gestures);
    native public int getX();
    native public int getY();
    native public int getWidth();
    native public int getHeight();
    native public int getLongPressTimeInterval();
    native public static boolean isSupported(int gestureEventIdentity);

    public boolean contains(int x, int y) {
        return !rectSet ||
               (x >= this.x && x <= this.endX &&
                y >= this.y && y <= this.endY);
    }

    public boolean supports(int type) {
        return (type & gestures) == type;
    }
}
