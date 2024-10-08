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

package com.sun.jsr082.bluetooth.btl2cap;

import java.io.IOException;
import java.io.InterruptedIOException;
import com.sun.jsr082.bluetooth.BluetoothUrl;
import javax.bluetooth.*;
import java.util.Enumeration;
import com.sun.j2me.app.AppPackage;

import com.sun.jsr082.bluetooth.BluetoothPush;

import com.sun.jsr082.bluetooth.SDDB;
import com.sun.jsr082.bluetooth.BCC;
import com.sun.jsr082.bluetooth.ServiceRecordImpl;
import com.sun.jsr082.bluetooth.BluetoothNotifier;
import com.sun.jsr082.bluetooth.SDP;

/*
 * Implementation of <code>L2CAPConnectionNotifier</code>.
 * An instance is created when
 * <code>Connector.open("btltcap://localhost...") </code>
 * is called from server application.
 */
public class L2CAPNotifierImpl extends BluetoothNotifier
        implements L2CAPConnectionNotifier {

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

    // IMPL_NOTE make it back private when moving emulation
    // below porting layer completed
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
     * Negotiated ReceiveMTU and TransmitMTU.
     * 16 high bits is ReceiveMTU, 16 low bits is TransmitMTU.
     *
     * This packeted value is returned by accept0 method and copied to
     * L2CAPConnectionImpl by it's constructor.
     */
    int mtus = (((-1) << 16) & 0xFFFF0000) & ((-1) & 0xFFFF);

    /* Keeps PSM value for service record validation. */
    private DataElement PSM;

    /* Keeps L2CAP UUID for service record validation. */
    static final DataElement L2CAP_UUID =
        new DataElement(DataElement.UUID, new UUID(0x0100));

    /* Bluetooth PushRegistry handle, used in native methods only. */
    private int pushHandle = 0;

    /*
     * Creates instance of <code>L2CAPNotifierImpl</code>.
     *
     * @param url <code>BluetoothUrl</code> that represents server
     *        connection string to create notifier for
     * @param mode I/O access mode
     * @throws IOException if an I/O error occurs
     */
    protected L2CAPNotifierImpl(BluetoothUrl url, int mode) throws IOException {
        super(url, mode);

        AppPackage app = AppPackage.getInstance();

        int appId = (app != null) ? app.getId() : 0;
        String connUrl = "btl2cap:" + url.caseSensitiveUrl;

        // check whether suiteId is valid.
        // for example, it can be null if L2CAPNotifier is created as SDP server
        // in PushRegistry inbound connection watcher thread that can be started
        // before MIDlet start.

        if ((app != null) && pushCheckout(connUrl, appId)) {
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
     * Creates an empty service record for the given URL and PSM value.
     *
     * @param notifier L2CAP notifier object to be associated with the record
     * @param url URL from which a new record is constructed
     * @param psm PSM value assigned to the notifier
     * @return a new service record instance
     */
    public static ServiceRecordImpl createServiceRecord(
            L2CAPNotifierImpl notifier, BluetoothUrl url, int psm) {
        DataElement serviceList = new DataElement(DataElement.DATSEQ);
        serviceList.addElement(new DataElement(DataElement.UUID,
                new UUID(url.uuid, false)));
        DataElement protocolList = new DataElement(DataElement.DATSEQ);
        DataElement protocol = new DataElement(DataElement.DATSEQ);
        protocol.addElement(L2CAP_UUID);
        if (notifier != null) {
            notifier.PSM = new DataElement(DataElement.U_INT_2, psm);
            protocol.addElement(notifier.PSM);
        } else {
            protocol.addElement(new DataElement(DataElement.U_INT_2, psm));
        }
        protocolList.addElement(protocol);
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
     * Creates an empty service record for the given URL.
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
            while (protocolListEnum.hasMoreElements()) {
                Enumeration protocolEnum = (Enumeration)((DataElement)
                        protocolListEnum.nextElement()).getValue();
                // check that the L2CAP UUID is not missing, check the PSM
                // is not missing and the value has not changed
                if (protocolEnum.hasMoreElements()) {
                    if (compareDataElements((DataElement)protocolEnum.
                            nextElement(), L2CAP_UUID)) {
                        if (!protocolEnum.hasMoreElements()) {
                            throw new ServiceRegistrationException(
                                    "PSM value is missing.");
                        }
                        if (PSM == null) {
                            PSM = new DataElement(DataElement.U_INT_2,
                                    ((DataElement)protocolEnum.
                                    nextElement()).getLong());
                            return;
                        }
                        if (!compareDataElements((DataElement)protocolEnum.
                                nextElement(), PSM)) {
                            throw new ServiceRegistrationException(
                                    "PSM value has changed.");
                        }
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
     * @throws IOException if notifier is closed, device is not
     *         in connectable mode, or service record is invalid
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
     * Accepts connections blocking until incoming client connection appears.
     *
     * @return connection to a client just accepted.
     *
     * @throws IOException if notifier is closed or device is not
     * in connectable mode.
     */
    public L2CAPConnection acceptAndOpen() throws IOException {
        ensureConnectable();

        // switch on listen mode if it has not been done yet
        doListen();

        // adds the service record if it is not yet in SDDB
        SDDB.getInstance().updateServiceRecord(serviceRec);

        L2CAPConnection client;
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
     * @exception IOException if an error occured lower in Bluetooth stack.
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
     * <code>handle<code> field of <code>L2CAPNotifierImpl</code> object.
     *
     * @throws IOException if an I/O error occurs
     */
    private native void listen0() throws IOException;



    /*
     * Advertises acception by calling underlying stack methods.
     *
     * @return L2CAPConnectionImpl instance to work with accepted client
     */
    protected L2CAPConnection doAccept() throws IOException {
        if (!isListenMode) {
            throw new BluetoothStateException("Device is not in listen mode");
        }

        /*
         * Note: native handle is set to peerHandleID field directly by accept0
         * method and retrieved by L2CAPConnectionImpl constructor.
         */
        mtus = accept0();

        return new L2CAPConnectionImpl(url, mode, this);
    }

    /*
     * Accepts incoming client connection request.
     *
     * Note: the method gets native connection handle directly from
     * <code>handle<code> field of <code>L2CAPNotifierImpl</code> object.
     *
     * Note: new native connection handle to work with accepted incoming
     * client connection is setted directly to <code>handle</code> field of
     * appropriate <code>L2CAPConnectionImpl</code> object.
     *
     * @return   Negotiated ReceiveMTU and TransmitMTU.
     *                 16 high bits is ReceiveMTU, 16 low bits is TransmitMTU.
     * @throws IOException if an I/O error occurs
     */
    protected native int accept0() throws IOException;


    /*
     * Closes this notifier at native layer.
     */
    protected void doClose() throws IOException {
        close0();
    }
    /*
     * Closes this server connection.
     * Releases all native resources (such as sockets) owned by this notifier.
     *
     * Note: the method gets native connection handle directly from
     * <code>handle<code> field of <code>L2CAPNotifierImpl</code> object.
     *
     * @throws IOException IOException if an I/O error occurs
     */
    private native void close0() throws IOException;


    /*
     * Creates an instanse of server connection at native layer.
     *
     * @param url <code>BluetoothUrl</code> that represents server
     *        connection string to create notifier for
     * @return selected psm value to listen for incoming connections on
     */
    private int doCreate(BluetoothUrl url) throws IOException {
        return create0(url.receiveMTU, url.transmitMTU, url.authenticate,
            url.authorize, url.encrypt, url.master);
    }

    /*
     * Creates a server connection.
     *
     * Note: the method sets native connection handle directly to
     * <code>handle<code> field of <code>L2CAPNotifierImpl</code> object.
     *
     * @param imtu receive MTU or <code>-1</code> if not specified
     * @param omtu transmit MTU or <code>-1</code> if not specified
     * @param auth   <code>true</code> if authication is required
     * @param authz  <code>true</code> if authorization is required
     * @param enc    <code>true</code> indicates
     *                what connection must be encrypted
     * @param master <code>true</code> if client requires to be
     *               a connection's master
     * @return selected psm value to listen for incoming connections on
     * @throws IOException IOException if an I/O error occurs
     */
    private native int create0(int imtu, int omtu, boolean auth, boolean authz,
        boolean enc, boolean master) throws IOException;

}
