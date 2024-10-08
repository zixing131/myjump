/*
 *   
 *
 * Copyright  1990-2009 Sun Microsystems, Inc. All Rights Reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version
 * 2 only, as published by the Free Software Foundation.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License version 2 for more details (a copy is
 * included at /legal/license.txt).
 * 
 * You should have received a copy of the GNU General Public License
 * version 2 along with this work; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA
 * 
 * Please contact Sun Microsystems, Inc., 4150 Network Circle, Santa
 * Clara, CA 95054 or visit www.sun.com if you need additional
 * information or have any questions.
 */

package com.sun.midp.events;

import com.sun.j2me.security.AccessController;

import com.sun.midp.main.*;

import com.sun.midp.security.*;
import com.sun.midp.log.Logging;
import com.sun.midp.log.LogChannels;

/**
 * Contains methods for posting events and registering to receiving events
 * from both the Java layer and native layer and a dedicated thread
 * for processing events. Events are processed in the order they were posted.
 * <p> 
 * Events can be posted from the native level or posted at
 * the Java level. When an event is posted at the Java level the event
 * pre-process method of associated event listener is called and at which time 
 * the event listener can stop the event from being posted by returning false. 
 * <p>
 * The run method of the EventQueue delivers events to event listeners and
 * polls the native event queue. When there are no events to deliver,
 * the run method waits after notifying the NativeEventMonitor to wake up
 * and monitor the native event queue.</p>
 * <p>
 * When performing a non-blocking read of a native event, an a empty
 * event object will be passed to the native method and the native
 * method will fill in the empty event in one call, saving up to 3 native
 * method calls per native event over the old stream based
 * implementation.</p>
 */
public class EventQueue implements Runnable {
    /** The global event queue. */
    private static EventQueue eventQueue;

    /**
     * Constructs, assigns a native event queue handle, and
     * starts the primary event queue for this isolate.
     */
    static {
        eventQueue = new EventQueue();

        eventQueue.nativeEventQueueHandle =
            eventQueue.getNativeEventQueueHandle();

        eventQueue.start();
    }

    /**
     * Event dispatcher thread.
     */
    Thread eventQueueThread;

    /**
     * Lock to synchronize on. The event queue or event dispatcher thread
     * are not used since they are given out to callers.
     */
    private Object eventQueueLock;

    /** Next event to dispatch. */
    Event nextEvent;

    /** Last event in the queue. */
    Event lastEvent;

    /**
     * Holds the event listeners and dispatch data. Each listener
     * will be placed at the index equal to the event type ID - 1 it
     * registered for (zero is an invalid type). This array will start empty
     * and grow if a listener is registered with an event type greater than
     * table length - 1 table since 0 is an invalid.
     */
    DispatchData[] dispatchTable;

    /** Number of events in the queue. */
    int numEvents; // = 0

    /** True, if the queue is alive. */
    boolean alive; // = false


    /** The thread running the native event monitor. */
    Thread eventMonitorThread;

    /** A pool for reusing native events. */
    NativeEventPool pool;

    /** This is for the native finalizer to reset peer native queue. */
    int nativeEventQueueHandle = -1;



    /**
     * Returns true if the current thread is the event queue dispatch
     * thread.
     *
     * @return true if the current thread is the event queue dispatch thread
     */
    public static boolean isDispatchThread() {
        return (Thread.currentThread() == eventQueue.eventQueueThread);
    }

    /**
     * Get a reference to the event queue in a secure way.
     *
     * @param token security token with the com.sun.midp permission "allowed"
     *
     * @return MIDP event queue reference
     */
    public static EventQueue getEventQueue(SecurityToken token) {
        token.checkIfPermissionAllowed(Permissions.MIDP);

        return eventQueue;
    }

    /**
     * Get a reference to the event queue in a secure way.
     * The calling suite must have the com.sun.midp permission "allowed".
     *
     * @return MIDP event queue reference
     */
    public static EventQueue getEventQueue() {
        AccessController.checkPermission(Permissions.MIDP_PERMISSION_NAME);

        return eventQueue;
    }

    /**
     * Constructs an event queue.  This does not assign a native event queue
     * handle. It creates the event threads, but it doesn't start them.
     */
    EventQueue() {
        /*
         * Currently we know of 33 events. The table will grow if needed.
         * for testing we need to lower that without changing code.
         */
        int tableSize = 33;

        tableSize =
            Configuration.getPositiveIntProperty(
                "com.sun.midp.events.dispatchTableInitSize", tableSize);
        dispatchTable = new DispatchData[tableSize];

        eventQueueThread = new Thread(this);
        eventQueueThread.setPriority(Thread.MAX_PRIORITY);

        eventQueueLock = new Object();


        pool = new NativeEventPool();

        eventMonitorThread =
            new Thread(
                new NativeEventMonitor(eventQueueLock, this, pool));
        eventMonitorThread.setPriority(Thread.MAX_PRIORITY);


    }






















    /** Starts the event queue and event monitor threads. */
    void start() {
        resetNativeEventQueue();
        eventQueueThread.start();
        eventMonitorThread.start();
    }

    /**
     * Clears native event queue for a given isolate - 
     * there could be some events from isolate's previous usage.
     */
    private native void resetNativeEventQueue();
    
    /**
     * Get the handle of the native peer event queue.
     *
     * WARNING: The native code can handle only one event queue per isolate.
     * Only one event queue object in any isolate should have a native handle
     * assigned.  If multiple Java event queue objects in the same isolate
     * have native handles assigned, this causes serious problems.
     *
     * @return Native event queue handle
     */
    private native int getNativeEventQueueHandle();

    /**
     * Send a native event to a specific Isolate.
     *
     * @param event a native event
     * @param isolateId ID of the receiving Isolate
     */
    public native void sendNativeEventToIsolate(NativeEvent event,
                                                int isolateId);


    /**
     * Native finalizer to reset the native peer event queue when
     * the Isolate ends.
     */








    /**
     * Queue a shutdown event to the native event queue.
     */
    private native void sendShutdownEvent();

    private native void finalize();


    /**
     * Register to preprocess and process events of single type.
     *
     * @param eventType eventType as an integer as listed in midpEvents.h
     * @param listener listener for the event type
     *
     * @exception IllegalArgumentException if the event type is not positive,
     *            or the listener is null
     */
    public void registerEventListener(int eventType, EventListener listener) {
        if (eventType <= 0) {
            throw new IllegalArgumentException("Event type is not positive");
        }

        if (listener == null) {
            throw new IllegalArgumentException("Listener is null");
        }

        synchronized (eventQueueLock) {
            if (eventType > dispatchTable.length) {
                DispatchData[] newTable = new DispatchData[eventType + 1];

                /* Grow the dispatch table. */
                for (int i = 0; i < dispatchTable.length; i++) {
                    newTable[i] = dispatchTable[i];
                }

                dispatchTable = newTable;
            }

            // IMPL_NOTE
	    if (Logging.REPORT_LEVEL <= Logging.WARNING) {
		if (dispatchTable[eventType - 1] != null) {
		    Logging.report(Logging.WARNING, LogChannels.LC_CORE,
				   "Warning overwriting event listener");
		}
	    }

            dispatchTable[eventType - 1] = new DispatchData(listener);
        }
    }

    /**
     * Post an event to the queue. The reference to the event will be put in
     * the queue without copying, so the caller should not reuse events
     * passed to this method. The implementation uses a dispatch table
     * indexed by event type ID. So if there is no event listener registered
     * for event either a <code>NullPointerException</code> or a
     * <code>IndexOutOfBoundException</code> will be thrown.
     *
     * @param event event to post
     *
     * @exception IndexOutOfBoundsException see method description
     * @exception NullPointerException see method description
     */
    public void post(Event event) {
        DispatchData dispatchData;
        
        synchronized (eventQueueLock) {
            if (event.type < 1) {
                if (Logging.REPORT_LEVEL <= Logging.ERROR) {
                    Logging.report(Logging.ERROR,
                                   LogChannels.LC_CORE,
                                   "Invalid event in the queue.");
                }

                return;
            }

            if (event.type > dispatchTable.length) {
                if (Logging.REPORT_LEVEL <= Logging.ERROR) {
                    Logging.report(Logging.ERROR,
                                   LogChannels.LC_CORE,
                                   "Cannot dispatch: " +
                                   "No listener for this event type: " +
                                   event.type);
                }

                return;
            } 

            if (event.type != EventTypes.EVENT_QUEUE_SHUTDOWN) {
                dispatchData = dispatchTable[event.type - 1];
                if (dispatchData == null) {
                    if (Logging.REPORT_LEVEL <= Logging.ERROR) {
                        Logging.report(Logging.ERROR, LogChannels.LC_CORE,
                            "Cannot dispatch: " +
			    "No listener for this event type: " +
			    event.type);
                    }

                    return;
                }

                if (!dispatchData.listener.preprocess(event,
                        dispatchData.waitingEvent)) {
                    /* The listener does not want this event posted. */
                    return;
                }

                dispatchData.waitingEvent = event;
            }

            if (lastEvent != null) {
                lastEvent.next = event;
            } else {
                nextEvent = event;
            }
                
            lastEvent = event;

            // IMPL_NOTE
	    if (Logging.REPORT_LEVEL <= Logging.INFORMATION) {
		numEvents++;
		if (numEvents > 30) {
		    Logging.report(Logging.INFORMATION, LogChannels.LC_CORE,
				   "*** queue overloaded, num events = " 
				   + numEvents);
		}
	    }

            eventQueueLock.notifyAll();
        }
    }
    
    /**
     * Remove the oldest event of the given type from the queue.
     *
     * @param eventType event type ID of the to remove
     *
     * @return the event removed or NULL if there is no event of the
     *     given type in the queue
     */
    public Event remove(int eventType) {
        Event prev = null;
        Event result = null;
        DispatchData dispatchData;

        synchronized (eventQueueLock) {
            /* find the event and the previous one */
            for (Event current = nextEvent; current != null;
                     prev = current, current = current.next) {
                if (current.type == eventType) {
                    result = current;
                    break;
                }
            }

            if (result == null) {
                /* event of the given type not found */
                return null;
            }

            /* remove the event from the queue */

            dispatchData = dispatchTable[eventType - 1];

            if (dispatchData.waitingEvent == result) {
                dispatchData.waitingEvent = null;
            }

            if (result == nextEvent) {
                nextEvent = result.next;
            }

            if (result == lastEvent) {
                lastEvent = prev;
            }

            if (prev != null) {
                prev.next = result.next;
            }

            result.next = null;

	    // IMPL_NOTE
	    if (Logging.REPORT_LEVEL <= Logging.INFORMATION) {
		numEvents--;
            }
        }

        return result;
    }

    /**
     * Shuts down the event queue after process any posted events.
     * Will block until the queue is shut down.
     *
     * @exception IllegalStateException if called from the event thread
     */
    public void shutdown() {
        if (isDispatchThread()) {
            throw new IllegalStateException("Shutdown called in event thread");
        }

	sendShutdownEvent();

        synchronized (eventQueueLock) {
            while (alive) {
                try {
                    eventQueueLock.wait();
                } catch (InterruptedException ie) {
                    EventQueue.handleFatalError(ie);
                }
            }
        }

        resetNativeEventQueue();

    }

    /** Runs the event queue. See the class description for details. */
    public void run() {
        Event event = null;
        DispatchData dispatchData;
        
        alive = true;

        for (; ; ) {
            try {
                synchronized (eventQueueLock) {
                    while (nextEvent == null) {
                        /* Wait until a event is pending. */
                        eventQueueLock.wait();
                    }

                    event = nextEvent;
                    nextEvent = event.next;
                    event.next = null;
                    if (nextEvent == null) {
                        lastEvent = null;
                    }

                    if (event.type == EventTypes.EVENT_QUEUE_SHUTDOWN) {
                        /* Time to shutdown. */
                        alive = false;
                        eventQueueLock.notifyAll();
                        return;
                    }
                            
                    dispatchData = dispatchTable[event.type - 1];

                    if (dispatchData.waitingEvent == event) {
                        dispatchData.waitingEvent = null;
                    }

		    // IMPL_NOTE
		    if (Logging.REPORT_LEVEL <= Logging.INFORMATION) {
			numEvents--;
		    }
                } // synchronized
                
		// IMPL_NOTE
		if (Logging.REPORT_LEVEL <= Logging.INFORMATION) {
		    Logging.report(Logging.INFORMATION, LogChannels.LC_CORE,
				   "*** processing event " + event.type);
		}

		dispatchData.listener.process(event);


                if (event instanceof NativeEvent) {
                    pool.putBack((NativeEvent)event);
                }


                // IMPL_NOTE
		if (Logging.REPORT_LEVEL <= Logging.INFORMATION) {
		    Logging.report(Logging.INFORMATION, LogChannels.LC_CORE,
				   "*** processed event " + event.type);
		}

                event = null;

            } catch (Throwable t) {
		if (!(t instanceof OutOfMemoryError)) {
		    t.printStackTrace();
		}
		handleFatalError(t);
            } // try
        } // for
    }

    /**
     * Handle a fatal error
     *
     * @param t the Throwable that caused the fatal error
     */
    static native void handleFatalError(Throwable t);
}

/** Holds the data need for each entry in the dispatch table. */
class DispatchData {
    /** Listener for an event. */
    EventListener listener;

    /** Previously posted event of this type waiting to be processed. */
    Event waitingEvent;

    /**
     * Construct a dispatch table entry.
     *
     * @param theListener listener for this entry
     */
    DispatchData(EventListener theListener) {
        listener = theListener;
    }
}


/**
 * Runs in its own Java thread. Wait for set of native events to arrive and
 * then post them as a set to the Java event queue.
 */
class NativeEventMonitor implements Runnable {
    /**
     * Wait for a native event and then read it.
     *
     * @param event empty event to fill in
     *
     * @return number of events still pending
     */
    private static native int waitForNativeEvent(NativeEvent event);

    /**
     * Read a native event without blocking.
     *
     * @param event empty event to fill in
     *
     * @return true if an event was read else false
     */
    private static native boolean readNativeEvent(NativeEvent event);

    /** Event queue lock to synchronize on. */
    private Object eventQueueLock;

    /** The event queue to which native events should be posted. */
    private EventQueue eventQueue;

    /** The pool for reusing native events. */
    private NativeEventPool pool;

    /**
     * Construct a native event monitor.
     *
     * @param theEventQueueLock event queue lock used synchronize event
     *  posting and processing
     * @param theEventQueue event queue to post native events into
     * @param thePool the pool from which native events are drawn
     */
    NativeEventMonitor(Object theEventQueueLock, EventQueue theEventQueue,
                       NativeEventPool thePool) {
        eventQueueLock = theEventQueueLock;
        eventQueue = theEventQueue;
        pool = thePool;
    }

    /**
     * Runs the native event monitor.
     * See the class description for details.
     */
    public void run() {
        try {
            for (; ; ) {
                NativeEvent nativeEvent = pool.get();
                int eventsStillPending = waitForNativeEvent(nativeEvent);

                /*
                 * To avoid back log in the native event queue, try to
                 * post any pending native events to the queue before
                 * processing an event from the Java event queue.
                 */
                synchronized (eventQueueLock) {
                    eventQueue.post(nativeEvent);

                    for (; eventsStillPending > 0; eventsStillPending--) {
                        nativeEvent = pool.get();

                        if (!readNativeEvent(nativeEvent)) {
                            break;
                        }

                        eventQueue.post(nativeEvent);
                    }
                }
            }
        } catch (Throwable t) {
	    if (!(t instanceof OutOfMemoryError)) {
		t.printStackTrace();
	    }
            EventQueue.handleFatalError(t);
        }
    }
}

/**
 * Pools native events, to avoid repetitive allocation by the native event
 * monitor.
 */
class NativeEventPool {
    /** The default size of the pool. */
    static final int DEFAULT_SIZE = 20;

    /** Native event storage. */
    NativeEvent[] eventStack;
    
    /** Number of events in the pool. */
    int eventsInPool; // = 0;

    /** Set up an event pool. */
    NativeEventPool() {
        eventStack = new NativeEvent[DEFAULT_SIZE];
    }

    /**
     * Gets an event from the pool or allocates one if the pool is empty.
     *
     * Note: the array entry isn't cleared.  This isn't a problem because the 
     * event will either eventually be returned to the pool, or its entry will 
     * be overwritten by another event returned to the pool.
     *
     * @return native event
     */
    NativeEvent get() {
        synchronized (eventStack) {
            if (eventsInPool == 0) {
                return new NativeEvent();
            }

            eventsInPool--;
            return eventStack[eventsInPool];
        }
    }

    /**
     * Returns an event to the pool.  Simply discards the event if the pool is
     * full.  Otherwise, cleans out the event (so that its strings can be
     * GC'ed) and adds the event to the pool.
     *
     * @param event event that has been processed
     */
    void putBack(NativeEvent event) {
        synchronized (eventStack) {
            if (eventsInPool == eventStack.length) {
                return;
            }

            event.clear();
            eventStack[eventsInPool] = event;
            eventsInPool++;
        }
    }
}

