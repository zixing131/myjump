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
package com.sun.jsr082.bluetooth.btspp;

import javax.bluetooth.*;

import javax.microedition.io.StreamConnection;
import javax.microedition.io.StreamConnectionNotifier;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InterruptedIOException;

import java.util.Vector;
import java.util.Enumeration;
/// IMPL_NOTE: revisit

import com.sun.jsr082.bluetooth.BluetoothPush;

import com.sun.j2me.app.AppPackage;
import com.sun.jsr082.bluetooth.SDDB;
import com.sun.jsr082.bluetooth.BCC;
import com.sun.jsr082.bluetooth.ServiceRecordImpl;
import com.sun.jsr082.bluetooth.BluetoothNotifier;
import com.sun.jsr082.bluetooth.BluetoothUrl;
import com.sun.jsr082.obex.btgoep.BTGOEPNotifier;

/*
 * Bluetooth Serial Port Profile notifier implementation.
 */
public class BTSPPNotifierImpl extends BluetoothNotifier
    implements StreamConnectionNotifier {

    /* Static initializer. */
    static {
        initialize();
    }

    /*
     * Native static class initializer.
     */
    private native static void initialize();

    /*
     * Native finalizer.
     * Releases all native resources used by this connection.
     */
    protected native void finalize();

    /*
     * Identidies this connection at native layer,
     * <code>-1<code> if connection is not open.
     */
    private int handle = -1;

    // IMPL_NOTE make private when moving emul below the porting layer completed.
    /*
     * Temporary stores peer's native handle for accepted connection.
     * Used by <code>doAccept</code> method.
     */
    int peerHandle = -1;

    /*
     * Temporary stores remote device address for accepted connection.
     */
    byte[] peerAddress = new byte[6];

    /* Indicates whether notifier is listening for incoming connections. */
    protected boolean isListenMode = false;

    /*
     * Channel Id.
     */
    private int cid;

    /* Keeps channel id for service record validation. */
    private DataElement CHANNEL_ID;

    /* Keeps L2CAP UUID for service record validation. */
    static final DataElement L2CAP_UUID =
        new DataElement(DataElement.UUID, new UUID(0x0100));

    /* Keeps RFCOMM UUID for service record validation. */
    static final DataElement RFCOMM_UUID =
        new DataElement(DataElement.UUID, new UUID(0x0003));

    /* Keeps SPP UUID for service record validation. */
    static final DataElement SPP_UUID =
        new DataElement(DataElement.UUID, new UUID(0x1101));

    /* Bluetooth PushRegistry handle, used in native methods only. */
    private int pushHandle = 0;

    /*
     * Creates instance of <code>BTSPPNotifierImpl</code>.
     *
     * @param url <code>BluetoothUrl</code> that represents server
     *        connection string to create notifier for.
     * @param mode I/O access mode
     * @throws IOException if there is no available channels to open connection
     * @throws ServiceRegistrationException if there is no available channel
     */
    public BTSPPNotifierImpl(BluetoothUrl url, int mode) throws IOException,
               ServiceRegistrationException {
        super(url, mode);

        AppPackage app = AppPackage.getInstance();
        String connUrl = "btspp:" + url.caseSensitiveUrl;

        if (url.protocol == url.OBEX) {
             connUrl = "btgoep:" + url.caseSensitiveUrl;
        }
        if (app != null && pushCheckout(connUrl, app.getId())) {
            serviceRec = BluetoothPush.getServiceRecord(this, connUrl);
            checkServiceRecord();
        } else {
            serviceRec = createServiceRecord(this, url, doCreate(url));
        }



    }

    /*
     * Checks out (takes ownership of) an active server connection maintained
     * by push subsystem.
     *
     * @param url URL used during registration of the push entry
     * @param suiteId suite id
     * @return true if the operation succeeds, false otherwise
     */

    private native boolean pushCheckout(String url, int suiteId);


    /*
     * Creates an empty service record for the given URL and channel value.
     *
     * @param notifier SPP notifier object to be associated with the record
     * @param url URL from which a new record is constructed
     * @param cn channel value assigned to the notifier
     * @return a new service record instance
     */
    public static ServiceRecordImpl createServiceRecord(
            BTSPPNotifierImpl notifier, BluetoothUrl url, int cn) {
        DataElement serviceList = new DataElement(DataElement.DATSEQ);
        serviceList.addElement(new DataElement(DataElement.UUID,
                new UUID(url.uuid, false)));
        serviceList.addElement(SPP_UUID);
        DataElement protocolList = new DataElement(DataElement.DATSEQ);
        DataElement protocol = new DataElement(DataElement.DATSEQ);
        protocol.addElement(L2CAP_UUID);
        protocolList.addElement(protocol);
        protocol = new DataElement(DataElement.DATSEQ);
        protocol.addElement(RFCOMM_UUID);
        if (notifier != null) {
            notifier.CHANNEL_ID = new DataElement(DataElement.U_INT_1, cn);
            protocol.addElement(notifier.CHANNEL_ID);
        } else {
            protocol.addElement(new DataElement(DataElement.U_INT_1, cn));
        }
        protocolList.addElement(protocol);
        if (url.protocol == url.OBEX) {
                DataElement p = new DataElement(DataElement.DATSEQ);
                p.addElement(BTGOEPNotifier.DE_OBEX_UUID); // obex UUID
                protocolList.addElement(p);
        }
        int[] attrIDs;
        DataElement[] attrVals;
        if (url.name != null) {
            DataElement name = new DataElement(DataElement.STRING, url.name);
            attrIDs = new int[] {
                ServiceRecordImpl.SERVICE_CLASS_ATTR_ID,
                ServiceRecordImpl.PROTOCOL_DESCRIPTOR_LIST,
                ServiceRecordImpl.NAME_ATTR_ID
            };
            attrVals = new DataElement[] { serviceList, protocolList, name };
        } else {
            attrIDs = new int[] {
                ServiceRecordImpl.SERVICE_CLASS_ATTR_ID,
                ServiceRecordImpl.PROTOCOL_DESCRIPTOR_LIST
            };
            attrVals = new DataElement[] { serviceList, protocolList };
        }
        return new ServiceRecordImpl(notifier, attrIDs, attrVals);
    }

    /*
     * Creates an empty service record for the given URL
     *
     * @param url URL from which a new record is constructed
     * @return a new service record instance
     */
    public static ServiceRecordImpl createServiceRecord(String url) {
        return createServiceRecord(null, new BluetoothUrl(url), 0);
    }

    /*
     * Ensures that the service record is valid.
     *
     * @throws ServiceRegistrationException in case described in the 
     *                                      JSR specification
     */
    protected void checkServiceRecord() throws ServiceRegistrationException {
        synchronized (serviceRec) {
            // check if the ServiceClassIDList is not missing
            if (serviceRec.getAttributeValue(
                    ServiceRecordImpl.SERVICE_CLASS_ATTR_ID) == null) {
                throw new ServiceRegistrationException(
                        "ServiceClassIDList is missing.");
            }
            // check the ProtocolList is not missed
            DataElement protocolList = serviceRec.getAttributeValue(
                    ServiceRecordImpl.PROTOCOL_DESCRIPTOR_LIST);
            if (protocolList == null) {
                throw new ServiceRegistrationException(
                        "ProtocolDescriptorList is missing.");
            }
            Enumeration protocolListEnum =
                    (Enumeration)protocolList.getValue();
            boolean l2cap = false;
            boolean rfcomm = false;
            while (protocolListEnum.hasMoreElements()) {
                Enumeration protocolEnum = (Enumeration)((DataElement)
                        protocolListEnum.nextElement()).getValue();
                // check that L2CAP/RFCOMM UUIDs are not missing, check the CN
                // is not missing and the value has not changed
                while (protocolEnum.hasMoreElements()) {
                    DataElement element = (DataElement)protocolEnum.
                            nextElement();
                    if (compareDataElements(element, L2CAP_UUID)) {
                        l2cap = true;
                    }
                    if (compareDataElements(element, RFCOMM_UUID)) {
                        rfcomm = true;
                        if (CHANNEL_ID != null) {
                            if (!protocolEnum.hasMoreElements() ||
                                !compareDataElements((DataElement)protocolEnum.
                                nextElement(), CHANNEL_ID)) {
                                throw new ServiceRegistrationException(
                                        "Channel value has changed.");
                            }
                        }
                    }
                    if (l2cap && rfcomm) {
                        return;
                    }
                }
            }
        }
        throw new ServiceRegistrationException("L2CAP UUID is missing.");
    }

    /*
     * Ensures that this notifier can accept connections.
     *
     * @throws IOException if notifier is closed or device is not
     *         in connectable mode
     * @throws ServiceRegistrationException if the service record is not valid
     */
    private void ensureConnectable() throws IOException {
        if (isClosed) {
            throw new BluetoothConnectionException(
                    BluetoothConnectionException.FAILED_NOINFO,
                    "Notifier is closed.");
        }
        if (!BCC.getInstance().isConnectable()) {
            throw new BluetoothStateException("The device is not connectable.");
        }
        checkServiceRecord();
    }

    /*
     * Accepts client connection to the service this notifier is assigned to.
     * Adds corresponding service record to the SDDB, blocks until a successfull
     * connection to a client is established, retrieves the connection.
     *
     * @return bi-directional connection to a client just accepted.
     *
     * @throws IOException if notifier is closed or device is not
     * in connectable mode.
     */
    public StreamConnection acceptAndOpen()
            throws IOException, ServiceRegistrationException {
        ensureConnectable();

        // switch on listen mode if it has not been done yet
        doListen();

        // adds the record only if is not yet in SDDB
        SDDB.getInstance().updateServiceRecord(serviceRec);

        StreamConnection client;
        do {
            ensureConnectable();

            // accept incoming connections if any
            client = doAccept();
        } while (client == null);

        return client;
    }

    /*
     * Closes this notifier making corresponding service record inaccessible.
     * updates the information on the communication server.
     *
     * @throws IOException if an error occured lower in Bluetooth stack.
     */
    public void close() throws IOException {
        if (isClosed) {
            return;
        }
        isClosed = true;

        SDDB.getInstance().removeServiceRecord(serviceRec);

        doClose();
    }

    /*
     * Force listen mode by calling underlying stack methods.
     *
     * @throws IOException if an error occured
     */

    private void doListen() throws IOException {
        // force listening if it had not been done yet
        if (!isListenMode) {
            listen0();

            isListenMode = true;
        }
    }

    /*
     * Force Bluetooth stack to listen for incoming client connections.
     *
     * Note: the method gets native connection handle directly from
     * <code>handle<code> field of <code>BTSPPNotifierImpl</code> object.
     *
     * @throws IOException if an I/O error occurs
     */
    private native void listen0() throws IOException;

    /*
     * Advertises acception by calling underlying stack methods.
     *
     * @return BTSPPConnection instance to work with accepted client
     */
    private StreamConnection doAccept() throws IOException {
        if (!isListenMode) {
            throw new BluetoothStateException("Device is not in listen mode");
        }

        /*
         * Note: native handle is set to peerHandleID field directly
         * by accept0 method and retrieved by L2CAPConnectionImpl constructor.
         */
        accept0();

        return new BTSPPConnectionImpl(url, mode, this);
    }

    /*
     * Accepts incoming client connection request.
     *
     * Note: the method gets native connection handle directly from
     * <code>handle<code> field of <code>BTSPPNotifierImpl</code> object.
     *
     * Note: new native connection handle to work with accepted incoming
     * client connection is setted directly to <code>handle</code> field of
     * appropriate <code>BTSPPConnectionImpl</code> object.
     *
     * @return <code>0</code> if incoming client connection was successfully
     *         accepted;
     *         <code>-1</code> if there is no pending incoming connections
     * @throws IOException if an I/O error occurs
     */
    protected native int accept0() throws IOException;


    /*
     * Closes this notifier at native layer.
     */
    private void doClose() throws IOException {
        close0();
    }

    /*
     * Closes this server connection.
     * Releases all native resources (such as sockets) owned by this notifier.
     *
     * Note: the method gets native connection handle directly from
     * <code>handle<code> field of <code>BTSPPNotifierImpl</code> object.
     *
     * @throws IOException IOException if an I/O error occurs
     */
    private native void close0() throws IOException;


    /*
     * Creates an instanse of server connection at native layer.
     *
     * @param url <code>BluetoothUrl</code> that represents server
     *        connection string to create notifier for
     * @return selected channel number to listen for incoming connections
     */
    private int doCreate(BluetoothUrl url) throws IOException {
        return create0(url.authenticate, url.authorize,
                url.encrypt, url.master);
    }

    /*
     * Creates a server connection.
     *
     * Note: the method sets native connection handle directly to
     * <code>handle<code> field of <code>BTSPPNotifierImpl</code> object.
     *
     * @param auth   <code>true</code> if authication is required
     * @param authz  <code>true</code> if authorization is required
     * @param enc    <code>true</code> indicates
     *                what connection must be encrypted
     * @param master <code>true</code> if client requires to be
     *               a connection's master
     * @return selected channel number to listen for incoming connections on
     * @throws IOException IOException if an I/O error occurs
     */
    private native int create0(boolean auth, boolean authz,
        boolean enc, boolean master) throws IOException;

}
