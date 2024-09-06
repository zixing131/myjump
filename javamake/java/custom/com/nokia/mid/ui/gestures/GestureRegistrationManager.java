package com.nokia.mid.ui.gestures;

import java.util.Hashtable;
import java.util.Vector;

import com.sun.midp.events.*;

class ZoneRegistration {
    public Object container;
    public GestureInteractiveZone zone;

    public ZoneRegistration(Object container, GestureInteractiveZone zone) {
        this.container = container;
        this.zone = zone;
    }
}

public class GestureRegistrationManager implements EventListener {
    public static final int MAX_SUPPORTED_GESTURE_INTERACTIVE_ZONES = 99;

    private static Vector zoneRegistrations = new Vector();
    private static Hashtable listenerRegistrations = new Hashtable();

    // http://developer.nokia.com/resources/library/Java/_zip/GUID-237420DE-CCBE-4A74-A129-572E0708D428/com/nokia/mid/ui/gestures/GestureEvent.html
    // The API imposes the restriction that the gesture event data is only valid during the call to
    // GestureListener.gestureAction(Object, GestureInteractiveZone, GestureEvent).
    private static GestureEventImpl gestureEvent = new GestureEventImpl();

    static {
        EventQueue eventQueue = EventQueue.getEventQueue();
        eventQueue.registerEventListener(EventTypes.GESTURE_EVENT, GestureRegistrationManager.getRegistrationManagerInstance());
    }

    private static GestureRegistrationManager gestureRegistrationManager = null;
    private static GestureRegistrationManager getRegistrationManagerInstance() {
        if (gestureRegistrationManager == null) {
            gestureRegistrationManager = new GestureRegistrationManager();
        }

        return gestureRegistrationManager;
    }

    public boolean preprocess(Event event, Event waitingEvent) {
        return true;
    }

    public void process(Event event) {
        gestureEvent.nativeEvent = (NativeEvent)event;

        for (int i = 0; i < zoneRegistrations.size(); i++) {
            ZoneRegistration zoneReg = (ZoneRegistration)zoneRegistrations.elementAt(i);

            GestureInteractiveZone zone = zoneReg.zone;

            if (!zone.contains(gestureEvent.getStartX(), gestureEvent.getStartY())) {
                continue;
            }

            if (!zone.supports(gestureEvent.getType())) {
                continue;
            }

            GestureListener listener = (GestureListener)listenerRegistrations.get(zoneReg.container);
            if (listener != null) {
                listener.gestureAction(zoneReg.container, zone, gestureEvent);
            }
        }
    }

    public static void setListener(Object container, GestureListener listener) throws IllegalArgumentException {
        if (listener != null) {
            listenerRegistrations.put(container, listener);
        } else {
            listenerRegistrations.remove(container);
        }
    }

    public static boolean register(Object container, GestureInteractiveZone gestureInteractiveZone) throws IllegalArgumentException {
        zoneRegistrations.addElement(new ZoneRegistration(container, gestureInteractiveZone));
        return true;
    }

    public static void unregister(Object container, GestureInteractiveZone gestureInteractiveZone) throws IllegalArgumentException {
        for (int i = 0; i < zoneRegistrations.size(); i++) {
            ZoneRegistration zoneReg = (ZoneRegistration)zoneRegistrations.elementAt(i);

            if (zoneReg.zone == gestureInteractiveZone && zoneReg.container == container) {
                zoneRegistrations.removeElementAt(i);
                i -= 1;
            }
        }
    }

    public static void unregisterAll(Object container) throws IllegalArgumentException {
        for (int i = 0; i < zoneRegistrations.size(); i++) {
            ZoneRegistration zoneReg = (ZoneRegistration)zoneRegistrations.elementAt(i);
            
            if (zoneReg.container == container) {
                zoneRegistrations.removeElementAt(i);
                i -= 1;
            }
        }
    }

    native public static GestureInteractiveZone getInteractiveZone(Object container);
}
