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
import com.sun.jsr082.bluetooth.BluetoothUtils;

/*
 * BluetoothStack implementation which relies on HCI command/event flow.
 */
public class JavacallBluetoothStack extends BluetoothStack {

    /* Maximum HCI packet size as defined by Bluetooth 1.1 specification. */
    private final int MAX_HCI_PACKET_SIZE = 257;
    /* This values must be identical with Javanotify events IDs */
    /*in the btStackEvent.c file*/  
    /* HCI Inquiry Complete event code. */
    protected final static int JAVACALL_BT_EVENT_INQUIRY_COMPLETE         = 1;
    /* HCI Inquiry Result event code. */
    protected final static int JAVACALL_BT_EVENT_INQUIRY_RESULT           = 2;
    /* HCI Authentication Complete event code. */
    protected final static int JAVACALL_BT_EVENT_AUTHENTICATION_COMPLETE  = 3;
    /* HCI Remote Name Request Complete event code. */
    protected final static int JAVACALL_BT_EVENT_REMOTE_NAME_COMPLETE     = 4;
    /* HCI Encrypt Change event code. */
    protected final static int JAVACALL_BT_EVENT_ENCRYPTION_CHANGE        = 5;
    /* HCI Service Discovered event code */
    protected final static int JAVACALL_BT_EVENT_SERVICE_DISCOVERED       = 6;
    /* HCI Service Search Completed event code */
    protected final static int JAVACALL_BT_EVENT_SERVICE_SEARCH_COMPLETED = 7;

    /* Internal byte array for storing incoming HCI events. */
    private byte[] buffer = new byte[MAX_HCI_PACKET_SIZE];

    /*
     * Extracts Bluetooth address from the internal buffer.
     *
     * @param offset offset in the internal buffer
     * @return Bluetooth address consisting of 12 hexadecimal characters
     */
    protected String extractAddress(int offset) {
        byte[] addr = new byte[BluetoothUtils.BTADDR_SIZE];
        System.arraycopy(buffer, offset, addr, 0, BluetoothUtils.BTADDR_SIZE);
        return BluetoothUtils.getAddressString(addr);
    }

    /*
     * Extracts string (e.g. friendly name) from the internal buffer. The
     * string is stored in UTF-8 format and is terminated by NULL character.
     *
     * @param offset offset in the internal buffer
     * @return Java string retrieved from binary event data
     */
    protected String extractString(int offset) {
        int length = 0;
        while (offset + length < MAX_HCI_PACKET_SIZE &&
               buffer[offset + length] != 0) {
            length++;
        }
        // IMPL_NOTE: UTF-8 encoding support for Java strings?
//      return new String(buffer, offset, length, "UTF-8");
        return stringUTF8(buffer, offset, length);
    }

    /*
     * Creates Java String object from UTF-8 encoded string.
     *
     * @param buffer buffer containing the string in UTF-8 format
     * @param offset offset of the first character in the buffer
     * @param length length of the encoded string in bytes
     * @return Java String object containing the string in UTF-16 format
     */
    protected static native String stringUTF8(byte[] buffer, int offset,
            int length);

    /*
     * Extracts 2 octets from the internal buffer.
     *
     * @param offset offset in the internal buffer
     * @return 16 bits of data from the given offset
     */
    protected int extractShort(int offset) {
        return ((int)buffer[offset] & 0xff) |
                (((int)buffer[offset + 1] & 0xff) << 8);
    }

    /*
     * Retrieves Bluetooth event from HCI event data containing in the
     * internal buffer.
     *
     * @return BluetoothEvent subclass instance
     */
//    protected BluetoothEvent retrieveEvent(Object handle) {
    protected BluetoothEvent retrieveEvent(Object handle) {
        readData(buffer);
        int code = buffer[0];
        int len = buffer[1];
        switch (code) {
            case JAVACALL_BT_EVENT_INQUIRY_COMPLETE:
                return new InquiryCompleteEvent(buffer[2] == 0);
            case JAVACALL_BT_EVENT_INQUIRY_RESULT: {
                int num = buffer[2];
                int offset = 3;
                InquiryResult[] results = new InquiryResult[num];
                for (int i = 0; i < num; i++) {
                    String addr = extractAddress(offset);
                    int cod = 0;
                    for (int j = 0; j < 3; j++) {
                        cod |= ((int)buffer[offset + 9 + j] & 0xff) <<
                            (16 - j * 8);
                    }
                    results[i] = new InquiryResult(addr, cod);
                    offset += 14; // 14 is the size of the response structure
                }
                return new InquiryResultEvent(results);
            }
            case JAVACALL_BT_EVENT_AUTHENTICATION_COMPLETE:
                return new AuthenticationCompleteEvent(extractShort(3),
                        buffer[2] == 0);
            case JAVACALL_BT_EVENT_REMOTE_NAME_COMPLETE:
                return new NameResultEvent(extractAddress(3), extractString(9));
            case JAVACALL_BT_EVENT_ENCRYPTION_CHANGE:
                return new EncryptionChangeEvent(extractShort(3),
                        buffer[2] == 0, buffer[5] == 1);

















            default:
                return null;
        }
    }

}
