/*
 *
 *  Copyright  1990-2009 Sun Microsystems, Inc. All Rights Reserved.
 *  DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER
 *  
 *  This program is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU General Public License version
 *  2 only, as published by the Free Software Foundation.
 *  
 *  This program is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 *  General Public License version 2 for more details (a copy is
 *  included at /legal/license.txt).
 *  
 *  You should have received a copy of the GNU General Public License
 *  version 2 along with this work; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 *  02110-1301 USA
 *  
 *  Please contact Sun Microsystems, Inc., 4150 Network Circle, Santa
 *  Clara, CA 95054 or visit www.sun.com if you need additional
 *  information or have any questions.
 */
package com.sun.mmedia.protocol;

import com.sun.mmedia.Configuration;
import java.io.*;
import javax.microedition.io.*;
import javax.microedition.media.*;
import javax.microedition.media.protocol.*;



import java.util.Hashtable;

/**
 * A DataSource wrapper for InputStreams.
 */
public class CommonDS extends BasicDS implements SourceStream {
    //native private static int nFileExists(String filename);

    private long contentLength = -1;
    private InputStream inputStream;
    private ContentDescriptor contentDescriptor = null;
    private boolean connected = false;


    public void setLocator(String ml) throws MediaException {
        super.setLocator(urlCvrt(ml));
    }

    /**
     *  Sets the inputStream attribute of the CommonDS object
     *
     * @param  is  The new inputStream value
     */
    public void setInputStream(InputStream is) {
        connected = true;
        try {
            super.setLocator(null);
        } catch (MediaException e) { }
        inputStream = is;
        try {
            //enable to call to is.reset()
            is.mark(is.available());
        } catch (IOException ioe) {
                //ignore
        }
/*
        try {
            contentLength = is.available();
        } catch(IOException e) {
            contentLength = -1;
        }
*/
    }

    public void connect() throws IOException {
        if (connected) {
            return;
        }
        getConnection();
        connected = true;
    }

    /**
     *  Gets the connection attribute of the CommonDS object
     *
     * @exception  IOException  Description of the Exception
     */
    void getConnection() throws IOException {
        boolean goodurl = false;

        if (locator == null) {
            throw (new IOException(this + ": connect() failed"));
        }

        String fileName = getRemainder(locator);

        if (fileName == null) {
            throw new IOException("bad url: " + locator);
        }

        try {
            String locStr = locator.toLowerCase();
            if (locStr.startsWith("http:") || locStr.startsWith("https:")) {
                HttpConnection httpCon = 
                    (HttpConnection)Connector.open(locator);
                int rescode = httpCon.getResponseCode();
                // If the response code of HttpConnection is in the range of 
                // 4XX and 5XX, that means the connection failed.
                if (rescode >= 400) {
                    httpCon.close();
                    goodurl = false;
                } else {
                    String ct = httpCon.getType();
                    if (ct != null) {
                        int idx;
                        if ((idx = ct.indexOf(',')) > 0) {
                            ct = ct.substring(0,idx);
                        } else if ((idx = ct.indexOf(';')) > 0) {
                            ct = ct.substring(0,idx);
                        } else if ((idx = ct.indexOf(' ')) > 0) {
                            ct = ct.substring(0,idx);
                        }
                        contentDescriptor = new ContentDescriptor(ct);
                    }
                    inputStream = httpCon.openInputStream();
                    contentLength = httpCon.getLength();
                    httpCon.close();
                    goodurl = true;
                }
            } else if (locator.startsWith("file:")) {
                













                throw new IOException("file protocol isn't supported");
                
		    } else if (locator.startsWith("rtp:")) {
                if( "unknown".equals( contentType ) ) {
                    contentType = "content.rtp";
                }
                inputStream = null;
                contentLength = -1;
                goodurl = true;
            } else if (locator.startsWith("rtsp:")) {
                System.out.println( "*** CommonDS::getConnection() -- RTSP!!!" );
                //if( "unknown".equals( contentType ) ) {
                    contentType = "application/sdp";
                //}
                inputStream = null;
                contentLength = -1;
                goodurl = true;
            } else if (locator.equals(Manager.TONE_DEVICE_LOCATOR) 
                       || locator.equals(Manager.MIDI_DEVICE_LOCATOR)) {
                inputStream = null;
                contentLength = -1;
                goodurl = true;
            }
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception ex) {
            throw new IOException("failed to connect to " + 
                            locator + " : " + ex.getMessage());
        }

        if ( !goodurl)
            throw new IOException("bad url");
    }

    public synchronized void disconnect() {
        if (!connected) {
            return;
        }
        close();
        connected = false;
    }

    public void start() throws IOException {
    }

    public void stop() {
    }

    /**
     *  Gets the streams attribute of the CommonDS object
     *
     * @return    The streams value
     */
    public SourceStream[] getStreams() {
        if (inputStream == null) {
            return new SourceStream [] { null };
        }
        return new SourceStream [] { this };
    }

    public long getDuration() {
        return Player.TIME_UNKNOWN;
    }

    /**
     * Methods for SourceStream.
     */

    private long location;


    /**
     *  Gets the contentDescriptor attribute of the CommonDS object
     *
     * @return    The contentDescriptor value
     */
    public ContentDescriptor getContentDescriptor() {
        return contentDescriptor;
    }


    /**
     *  Gets the transferSize attribute of the CommonDS object
     *
     * @return    The transferSize value
     */
    public int getTransferSize() {
        return -1;
    }


    /**
     * read will perform a blocking read from stream.  If
     * buffer is null up to length bytes are read and discarded.
     *
     * @param  buffer           buffer to read into
     * @param  offset           offset in the buffer to put data
     * @param  length           bytes to read
     * @returns                 bytes read or -1 for end of media
     * @exception     IOException
     */
    public int read(byte buffer[], int offset, int length) throws IOException {
        int bytesRead;
        int len = length;
        int off = offset;
        do {
            bytesRead = inputStream.read(buffer, off, len);
            if (bytesRead == -1) {
                int totalBytesRead = length - len;
                return (totalBytesRead > 0) ? totalBytesRead : -1;
            } else {
                location += bytesRead;
                len -= bytesRead;
                off += bytesRead;
            }

            if ( len != 0)
                Thread.yield();

        } while (len != 0);

        return length;
    }


    /**
     * Seek to the specified point in the stream.
     *
     * @param  where            the position to seek to
     * @returns                 the new stream position
     */
    public long seek(long where) throws IOException {
        int seekable = this.getSeekType();

        if (seekable == NOT_SEEKABLE) {
            throw new IOException("can't seek");
        }

        if (where < 0) {
            where = 0;
        }

        if (seekable == SEEKABLE_TO_START && where != 0) {
            throw new IOException("can't seek");
        }

        if ((contentLength > 0) && (where > contentLength)) {
            where = contentLength;
        }

        long oldLocation = location;
        long skipped = 0;

        if (where < oldLocation) { // seek backward
            reopenStream();
            location = skip(inputStream, where);
        } else {
            skipped = skip(inputStream, (where - oldLocation));
            location = oldLocation + skipped;
        }

        return (location);
    }


    /**
     *  Description of the Method
     *
     * @exception  IOException  Description of the Exception
     */
    public void reopenStream() throws IOException {
        if (inputStream == null) {
            return;
        }

        // reopen the stream and go to the beginning of the stream
        try {
            inputStream.reset();
            return;
        } catch (IOException ex) {
            if (getLocator() == null) {
                throw ex;
            }
        }

        if (inputStream != null) {
            inputStream.close();
            inputStream = null;
        }
        getConnection();
    }

    /**
     * Obtain the current point in the stream.
     *
     * @returns    the current point in the stream
     */
    public long tell() {
        return location;
    }


    /**
     * close the stream which PullSourceStream handles
     *
     * @exception  if an I/O error occurs
     */
    public synchronized void close() {
        if (inputStream == null) {
            return;
        }

        try {
            inputStream.close();
            inputStream = null;
        } catch (Exception e) {
        }
    }

    public long getContentLength() {
        return contentLength;
    }

    static final private int BUFLEN = 512;
    static private byte[] buf = null;

    /**
     * @return number of bytes actually skipped
     */
    private long skip(InputStream istream, long amount) throws IOException {
        long remaining = amount;
        int actual;
    
        if (buf == null)
            buf = new byte[BUFLEN];
    
        while (remaining > 0) {
            // istream.skip() does not work in particular impl cldc
    
            actual = (int)(remaining > BUFLEN ? BUFLEN : remaining);
            actual = istream.read(buf, 0, actual);
    
            if (actual == 0) {
                // in the of case that amount > the rest available length of
                // inputstream, end the while loop,otherwise will loop forever
                // inputstream.available always return 0, can not be used here.
                break;
            }
            remaining -= actual;
        }
        return (amount - remaining);
    }

    public int getSeekType() {
        if (inputStream == null) {
            return NOT_SEEKABLE;
        }
        return RANDOM_ACCESSIBLE;
    }

    static private String getRemainder(String loc) {
        String proto = "";
        int idx = loc.indexOf(':');
    
        if( idx != -1) {
            proto = loc.substring(idx+1);
        }
    
        return proto;
    }

    public static String urlCvrt(String theml) {
        String proto = getProtocol(theml);
        String ret = theml;
    
        // If it's file protocol, we'll try to strip out special characters
        // in the URL syntax:
        // %xx = the ASCII represented by the hexadecimal number "xx".
        if (proto != null && proto.equals("file")) {
            int idx;
            String file = getRemainder(theml);
            boolean changed = false;
            
            if (file == null) {
                    return (theml);
                }
                try {
                idx = 0;
                while ((idx = file.indexOf("%", idx)) >= 0) {
                    if (file.length() > idx + 2) {
                        byte [] bytes = new byte[1];
                        try {
                            bytes[0] = (byte)Integer.valueOf(
                              file.substring(idx + 1, idx + 3), 16).intValue();
                            file = file.substring(0, idx) + new String(bytes) +
                            file.substring(idx + 3);
                            changed = true;
                        } catch (NumberFormatException ne) {
                        }
                    }
                    idx++;
                }
                if (changed)
                        ret = proto + ":" + file;
            } catch (Exception e) {
            ret = theml;
            }
        }
        return ret;
    }
}
