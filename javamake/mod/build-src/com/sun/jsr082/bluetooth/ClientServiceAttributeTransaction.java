/*
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

import java.io.IOException;
import java.util.Enumeration;

import javax.bluetooth.DataElement;

/*
 * Provides ServiceAttribute transaction functionality.
 */
public class ClientServiceAttributeTransaction extends SDPClientTransaction {

    /* ServiceRecordHandle (BT Spec 1.2 Vol 3 page 138). */
    int serviceRecordHandle;
    /* AttributeIDList (BT Spec 1.2 Vol 3 page 139). */
    DataElement attributeIDList;
    /* AttributeList (BT Spec 1.2 Vol 3 page 140). */
    byte[] attributes;

    /*
     * Constructs ServiceAttributeTransaction object.
     */
    ClientServiceAttributeTransaction(JavaSDPClient client, int transactionID,
            SDPResponseListener listener, int recordHandle,
            int[] attrSet) {
        super(client, SDPClientTransaction.SDP_SERVICE_ATTRIBUTE_REQUEST, transactionID, listener);
        serviceRecordHandle = recordHandle;
        attributeIDList = new DataElement(DataElement.DATSEQ);
        for (int i = 0; i < attrSet.length; i++) {
            attributeIDList.addElement(new DataElement(
                    DataElement.U_INT_2, attrSet[i]));
        }
        parameterLength = super.client.getConnection().getReaderWriter().getDataSize(attributeIDList) + 6;
    }

    /*
     * Writes transaction-specific parameters into the PDU.
     *
     * @throws IOException when an I/O error occurs
     */
    void writeParameters() throws IOException {
        super.client.getConnection().getReaderWriter().writeInteger(serviceRecordHandle);
        super.client.getConnection().getReaderWriter().writeShort((short)MAX_ATTRIBUTE_BYTE_COUNT);
        super.client.getConnection().getReaderWriter().writeDataElement(attributeIDList);
    }

    /*
     * Reads transaction-specific parameters from the PDU.
     *
     * @param length length of PDU's parameters
     * @throws IOException when an I/O error occurs
     */
    void readParameters(int length) throws IOException {
        short byteCount = super.client.getConnection().getReaderWriter().readShort();
        byte[] data = super.client.getConnection().getReaderWriter().readBytes(byteCount);
        if (attributes == null) {
            attributes = data;
        } else {
            byte[] temp = attributes;
            attributes = new byte[temp.length + byteCount];
            System.arraycopy(temp, 0, attributes, 0, temp.length);
            System.arraycopy(data, 0, attributes, temp.length,
                    byteCount);
        }
    }

    /*
     * Completes the transaction by calling corresponding listener's
     * method with the data retrieved.
     */
    public void complete() {
        DataElement attrList;
        DataElementSerializer des = new DataElementSerializer();
        try {
            attrList = des.restore(attributes);
        } catch (IOException e) {
            listener.serviceAttributeResponse(null, null,
                    ssTransID);
            return;
        }
        int size = attrList.getSize() / 2;
        if (size == 0) {
            listener.serviceAttributeResponse(null, null,
                    ssTransID);
            return;
        }
        Enumeration elements = (Enumeration)attrList.getValue();
        final int[] attrIDs = new int[size];
        final DataElement[] attrValues = new DataElement[size];
        for (int i = 0; elements.hasMoreElements(); i++) {
            attrIDs[i] = (int)((DataElement)
                    elements.nextElement()).getLong();
            attrValues[i] = ((DataElement)
                    elements.nextElement());
        }
        listener.serviceAttributeResponse(attrIDs, attrValues, ssTransID);
    }
}
