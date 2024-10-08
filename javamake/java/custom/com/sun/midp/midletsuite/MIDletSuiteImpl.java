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

package com.sun.midp.midletsuite;

import java.io.*;

import java.util.*;

import javax.microedition.io.*;

import javax.microedition.lcdui.*;

import javax.microedition.midlet.*;

import com.sun.midp.io.*;

import com.sun.midp.security.*;

import com.sun.midp.midlet.*;

import com.sun.midp.midletsuite.SuiteProperties;

import com.sun.midp.io.j2me.storage.*;

import com.sun.midp.log.Logging;
import com.sun.midp.log.LogChannels;

import com.sun.midp.util.Properties;
import com.sun.midp.configurator.Constants;

/**
 * Implements the required MIDletSuite functionality needed by the
 * system.
 */
public final class MIDletSuiteImpl implements MIDletSuite {
    /** MIDlet Suite Storage. */
    private MIDletSuiteStorage midletSuiteStorage;

    /** Suite properties of the application descriptor and manifest. */
    private SuiteProperties suiteProperties;

    /** Installation information for this suite. */
    private InstallInfo installInfo;

    /** The ID of this suite. */
    private int id;

    /** Cache of MIDlet-1 name. */
    private String midlet_1_name;

    /** Cache of MIDlet-1 class. */
    private String midlet_1_class;

    /**
     * Number of midlets in this suite. less than 0 mean they need to
     * counted.
     */
    private int numberOfMidlets = -1;

    /**
     * Indicator to check if the suite has already been locked
     */
    private boolean locked = false;

    /**
     * Constructs MIDletSuiteImpl from an installed MIDlet Suite.
     *
     * @param theID unique identifier for this suite
     */
    MIDletSuiteImpl(int theID)
            throws MIDletSuiteCorruptedException {
        id = theID;
        locked = true;

        suiteProperties = new SuiteProperties(id);
        installInfo = new InstallInfo(id);

        try {
            installInfo.load();
        } catch (IOException ioe) {
            throw new MIDletSuiteCorruptedException(
                "installInfo.load IOException");
        }
    }

    /**
     * Gets a property of the suite. A property is an attribute from
     * either the application descriptor or JAR Manifest.
     *
     * @param key the name of the property
     * @return A string with the value of the property.
     *    <code>null</code> is returned if no value is available for
     *          the key.
     */
    public String getProperty(String key) {
        guaranteeMIDletSuiteLocked("getProperty");

        return suiteProperties.getProperty(key);
    }

    /**
     * Replace or add a property to the suite for this run only.
     *
     * @param token token with the AMS permission set to allowed,
     *        can be null to use the suite's permission
     * @param key the name of the property
     * @param value the value of the property
     *
     * @exception SecurityException if the caller's token does not have
     *            internal AMS permission
     */
    public void setTempProperty(SecurityToken token, String key,
            String value) {
        guaranteeMIDletSuiteLocked("setTempProperty");

        suiteProperties.setTempProperty(key, value);
    }

    /**
     * Checks to see the suite has the ALLOW level for specific permission.
     * This is used for by internal APIs that only provide access to
     * trusted system applications.
     *
     * @param permission permission ID from com.sun.midp.security.Permissions
     *
     * @exception SecurityException if the suite is not allowed the permission
     */
    public void checkIfPermissionAllowed(String permission) {
    }

    /**
     * Checks for permission and throw an exception if not allowed.
     * May block to ask the user a question.
     *
     * @param permission ID of the permission to check for,
     *      the ID must be from
     *      {@link com.sun.midp.security.Permissions}
     * @param resource string to insert into the question, can be null if
     *        no %2 in the question
     *
     * @exception SecurityException if the permission is not
     *            allowed by this token
     * @exception InterruptedException if another thread interrupts the
     *   calling thread while this method is waiting to preempt the
     *   display.
     */
    public void checkForPermission(String permission, String resource)
            throws InterruptedException {
    }

    /**
     * Checks for permission and throw an exception if not allowed.
     * May block to ask the user a question.
     *
     * @param permission ID of the permission to check for,
     *      the ID must be from
     *      {@link com.sun.midp.security.Permissions}
     * @param resource string to insert into the question, can be null if
     *        no %2 in the question
     * @param extraValue string to insert into the question,
     *        can be null if no %3 in the question
     *
     * @exception SecurityException if the permission is not
     *            allowed by this token
     * @exception InterruptedException if another thread interrupts the
     *   calling thread while this method is waiting to preempt the
     *   display.
     */
    public void checkForPermission(String permission, String resource,
            String extraValue) throws InterruptedException {
    }

    /**
     * Checks for permission and throw an exception if not allowed.
     * May block to ask the user a question.
     *
     * @param permissionStr ID of the permission to check for,
     *      the ID must be from
     *      {@link com.sun.midp.security.Permissions}
     * @param name name of the suite, %1 in the question
     * @param resource string to insert into the question, can be null if
     *        no %2 in the question
     * @param extraValue string to insert into the question,
     *        can be null if no %3 in the question
     *
     * @exception SecurityException if the permission is not
     *            allowed by this token
     * @exception InterruptedException if another thread interrupts the
     *   calling thread while this method is waiting to preempt the
     *   display.
     */
    private void checkForPermission(String permissionStr, String name,
            String resource, String extraValue) throws InterruptedException {
    }

    /**
     * Gets the status of the specified permission.
     * If no API on the device defines the specific permission
     * requested then it must be reported as denied.
     * If the status of the permission is not known because it might
     * require a user interaction then it should be reported as unknown.
     *
     * @param permission to check if denied, allowed, or unknown
     * @return 0 if the permission is denied; 1 if the permission is allowed;
     *  -1 if the status is unknown
     */
    public int checkPermission(String permission) {
        return 1;
    }

    /**
     * Gets the unique ID of the suite.
     *
     * @return suite ID
     */
    public int getID() {
        guaranteeMIDletSuiteLocked("getID");

        return id;
    }

    /**
     * Asks the user want to interrupt the current MIDlet with
     * a new MIDlet that has received network data.
     *
     * @param connection connection to place in the permission question or
     *        null for alarm
     *
     * @return true if the use wants interrupt the current MIDlet, else false
     */
    public boolean permissionToInterrupt(String connection) {
        return true;
    }

    /**
     * Indicates if the named MIDlet is registered in the suite
     * with MIDlet-&lt;n&gt; record in the manifest or
     * application descriptor.
     *
     * @param midletClassName class name of the MIDlet to be checked
     *
     * @return true if the MIDlet is registered
     */
    public boolean isRegistered(String midletClassName) {
        return true;
    }

    /**
     * Get the name of a MIDlet to display to the user from suite's
     * MIDlet-&lt;n&gt; record in the manifest or
     * application descriptor.
     *
     * @param className class name of the MIDlet to be checked
     *
     * @return name to display to the user
     */
    public String getMIDletName(String className) {
        String midlet;
        MIDletInfo midletInfo;

        guaranteeMIDletSuiteLocked("getMIDletName");

        for (int i = 1; ; i++) {
            midlet = getProperty("MIDlet-" + i);
            if (midlet == null) {
                return getProperty(SUITE_NAME_PROP);
            }

            /* Check if the names match. */
            midletInfo = new MIDletInfo(midlet);
            if (midletInfo.classname.equals(className)) {
                return midletInfo.name;
            }
        }
    }

    /**
     * Indicates if this suite is trusted.
     * (not to be confused with a domain named "trusted",
     * this is used for extra checks beyond permission checking)
     *
     * @return true if the suite is trusted false if not
     */
    public boolean isTrusted() {
        return true;
    }

    /**
     * Provides the number of of MIDlets in this suite.
     *
     * @return number of MIDlet in the suite
     */
    public int getNumberOfMIDlets() {
        guaranteeMIDletSuiteLocked("getNumberOfMIDlets");
        if (numberOfMidlets <= 0) {
            numberOfMidlets = countMIDlets();
        }

        return numberOfMidlets;
    }

    /**
     * Gets the installation information of this suite.
     *
     * @return installation information
     */
    public InstallInfo getInstallInfo() {
        guaranteeMIDletSuiteLocked("getInstallInfo");

        return installInfo;
    }

    /**
     * Gets the suite name for interruption purposes.
     *
     * @return name for interrupt question
     */
    private String getSuiteNameForInterrupt() {
        return getProperty(SUITE_NAME_PROP);
    }

    /**
     * Counts the number of MIDlets from its properties.
     *
     * @return number of midlet in the suite
     */
    private int countMIDlets() {
        String temp;
        MIDletInfo midletInfo;
        int i;

        temp = getProperty("MIDlet-1");
        if (temp == null) {
            return 0;
        }

        /* To save time starting up, cache the first MIDlet entry. */
        midletInfo = new MIDletInfo(temp);
        midlet_1_name =    midletInfo.name;
        midlet_1_class =    midletInfo.classname;

        for (i = 2; getProperty("MIDlet-" + i) != null; i++);

        return i - 1;
    }

    /**
     * Gets push options for this suite.
     *
     * @return push options are defined in {@link PushRegistryImpl}
     */
    public int getPushOptions() {
        return 0;
    }

    /**
     * Returns a reference to the singleton MIDlet suite storage object.
     *
     * @return the storage reference
     *
     * @exception SecurityException if the caller does not have permission
     *   to install software
     */
    private MIDletSuiteStorage getMIDletSuiteStorage()
            throws SecurityException {
        if (midletSuiteStorage == null) {
            midletSuiteStorage =
                MIDletSuiteStorage.getMIDletSuiteStorage();
        }

        return midletSuiteStorage;
    }

    /**
     * Unlocks the MIDletSuite.
     *
     */
    public void close() {
        if (locked) {
            unlockMIDletSuite(id);
            locked = false;
        }
    }

    /**
     * Native finalizer
     *
     */



    private native void finalize();


    /**
     * Unlocks the MIDletSuite.
     *
     * @param suiteId the name of the MIDletSuite
     */
    private static native void unlockMIDletSuite(int suiteId);

    /**
     * Locks the MIDletSuite.
     *
     * @param suiteId the name of the MIDletSuite
     * @param isUpdate true if the suite is being updated
     *
     * @exception MIDletSuiteLockedException is thrown, if the MIDletSuite is
     * locked
     */
    static native void lockMIDletSuite(int suiteId,
        boolean isUpdate) throws MIDletSuiteLockedException;

    /**
     * Guarantees the the MIDletSuite is locked.
     *
     * @param s the error message to print out.
     *
     * @exception IllegalStateException is thrown if the MIDletSuite
     * is not locked.
     */
    private void guaranteeMIDletSuiteLocked(String s) {
        if (!locked) {
            throw new IllegalStateException(s);
        }
    }
}
