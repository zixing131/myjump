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

package com.sun.jsr082.bluetooth;

import java.util.Enumeration;
import java.util.Hashtable;
import javax.bluetooth.ServiceRegistrationException;
import com.sun.jsr082.bluetooth.ServiceRecordSerializer;

import com.sun.jsr082.bluetooth.BluetoothPush;



/*
 * This class represents service discovery database (SDDB).
 */
public final class SDDB {

    /* The only instance of this class. */
    private static SDDB instance = null;

    /* Helper object for ServiveRecord serialization. */
    private ServiceRecordSerializer srs = new ServiceRecordSerializer();

    /*
     * Retrieves the SDDB instance, initializes if needed.
     *
     * Due to SDP uses java implementation of L2CAPConnection,
     * we may initialize SDP only when LocalDevice is initialized,
     * and application creates either notifier or connection.
     *
     * @return the SDDB instance
     */
    public static synchronized SDDB getInstance() {
        if (instance == null) {
            instance = new SDDB();
            




            




        }
        return instance;
    }

    /*
     * Creates an instance of this class.
     */
    private SDDB() {
    }

    /*
     * Creates or updates a service record in the SDDB.
     *
     * For records whose handle is 0, a new entry in SDDB is created.
     * Otherwise, an existing entry is updated.
     *
     * @param record service record to be added to or updated in the database
     * @throws ServiceRegistrationException if an error occured while
     *         updating SDDB
     */
    public void updateServiceRecord(ServiceRecordImpl record)
            throws ServiceRegistrationException {
        int oldHandle = record.getHandle();
        int classes = record.getDeviceServiceClasses();
        if (oldHandle == 0) {
            record.setHandle(0);
        }
        byte[] data = srs.serialize(record);
        int newHandle = updateRecord(oldHandle, classes, data);
        if (newHandle == 0) {
            throw new ServiceRegistrationException(
                    "Error updating service record.");
        }
        if (newHandle != oldHandle) {
            record.setHandle(newHandle);
        }
    }

    /*
     * Removes record from the database.
     *
     * @param record the service record that indicates one to be removed from
     *        the database
     */
    public void removeServiceRecord(ServiceRecordImpl record) {
        removeRecord(record.getHandle());
        record.setHandle(0);
    }

    /*
     * Checks if (a copy of) given record is already in the SDDB.
     * The record is cosidered to be in the SDDB if the database contains
     * a record with the same handle.
     *
     * @param record the record to be tested
     */
    public boolean contains(ServiceRecordImpl record) {
        return readRecord(record.getHandle(), null) > 0;
    }

    /*
     * Retrieves handles of all the records in the database as array.
     *
     * @return array of int that contains handles of all the service records
     *         from the database, each once and only them
     */
    int[] getHandles() {
        int size = getRecords(null);
        int handles[] = new int[size];
        getRecords(handles);
        return handles;
    }

    /*
     * Retrieves a service record from the database by the handle value.
     *
     * @param handle the handle value to get service record by
     * @return a reference to the record in the database if one with handle
     *         given presents, <code>null</code> otherwise
     */
    public ServiceRecordImpl getServiceRecord(int handle) {
        return getServiceRecord(handle, null);
    }

    /*
     * Retrieves a service record from the database by the handle value.
     *
     * @param handle the handle value to get service record by
     * @param notifier Bluetooth notifier to be used with the service record
     * @return a reference to the record in the database if one with handle
     *         given presents, <code>null</code> otherwise
     */
    public ServiceRecordImpl getServiceRecord(int handle,
            BluetoothNotifier notifier) {
        int size = readRecord(handle, null);
        if (size == 0) {
            return null;
        }
        byte[] data = new byte[size];
        readRecord(handle, data);
        ServiceRecordImpl record = srs.restore(notifier, data);
        record.setDeviceServiceClasses(getServiceClasses(handle));
        record.setHandle(handle);
        return record;
    }

    /*
     * Creates or updates service record in the SDDB.
     *
     * @param handle handle of the service record to be updated;
     *         if equals to 0, a new record will be created
     * @param classes device service classes associated with the record
     * @param data binary data containing attribute-value pairs in the format
     *         identical to the one used in the AttributeList parameter of
     *         the SDP_ServiceAttributeResponse PDU
     * @return service record handle, or 0 if the operation fails
     */
    public native int updateRecord(int handle, int classes, byte[] data);

    /*
     * Removes service record from the SDDB.
     *
     * @param handle hanlde of the service record to be deleted
     */
    public native void removeRecord(int handle);

    /*
     * Retrieves service record from the SDDB.
     *
     * @param handle handle of the service record to be retrieved
     * @param data byte array which will receive the data,
     *         or null for size query
     * @return size of the data read/required
     */
    private native int readRecord(int handle, byte[] data);

    /*
     * Retrieves service classes of a record in the SDDB.
     *
     * @param handle handle of the service record
     * @return service classes set for the record
     */
    private native int getServiceClasses(int handle);

    /*
     * Retrieves handles of all service records in the SDDB.
     *
     * @param handles array to receive handles, or null for count query
     * @return number of entries read/available
     */
    private native int getRecords(int[] handles);

    














}
