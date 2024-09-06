package com.nokia.mid.ui.lcdui;

import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import com.nokia.mid.ui.lcdui.DisplayStateListener;

public class LCDUIUtils {
    public static java.lang.Object getObjectTrait(java.lang.Object target, java.lang.String traitName) {
        System.out.println("LCDUIUtils::getObjectTrait(Object,String) not implemented");
        return null;
    }

    public static boolean setObjectTrait(java.lang.Object target, java.lang.String traitName, java.lang.Object value) {
        System.out.println("LCDUIUtils::setObjectTrait(Object,String) not implemented");
        return false;
    }

    public static boolean isDisplayActive(Display display) {
        System.out.println("LCDUIUtils::isDisplayActive(Display) not implemented");
        return true;
    }

    public static void setDisplayStateListener(Display display, DisplayStateListener listener) {
        System.out.println("LCDUIUtils::setDisplayStateListener(Dispay,DisplayStateListener) not implemented");
    }

    public static void setCurrent(Display display, Displayable displayable, String str) {
        System.out.println("LCDUIUtil::setCurrent no implemente.");
    }
}
