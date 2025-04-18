/*
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
 
package com.sun.mmedia;

import java.io.*;
import javax.microedition.media.*;
import javax.microedition.media.MediaException.*;
import javax.microedition.media.control.*;
import javax.microedition.io.*;





import com.sun.mmedia.*;
import com.sun.j2me.log.Logging;
import com.sun.j2me.log.LogChannels;

/**
 * RecordControl implementor
 * It uses native API layer to support recording
 */
public final class DirectRecord implements RecordControl, DirectControls {
    // KNI native functions
    private native int nSetLocator(int handle, String locator);
    private native int nStart(int handle);
    private native int nStop(int handle);
    private native int nPause(int handle);
    private native int nCommit(int handle);
    private native int nReset(int handle);
    private native int nClose(int handle);
    private native int nSetSizeLimit(int handle, int size);
    private native int nGetRecordedSize(int handle);
    private native int nGetRecordedData(int handle, int offset, int size, byte[] buffer);
    private native String nGetRecordedType(int handle);

    


    private native void finalize();
    

    public DirectRecord(BasicPlayer player) {
        this.player = player;
    }

    /**
     * Set record stream
     */
    public synchronized void setRecordStream(OutputStream stream) {
        if (recordRequested)
    	    throw new IllegalStateException("startRecord has been called and commit has not been called");
    	
    	if (locator != null)
    	    throw new IllegalStateException("setRecordLocation has been called and commit has not been called");
    	
    	if (stream == null)
    	    throw new IllegalArgumentException("null stream specified");
    
    	// Check for the record permissions.
      	checkPermission();
    
        recordingByNative = false;
        this.locator = null;
    	this.stream = stream;
        extStream = true;
    }
    
    /**
     * Set record location
     */
    public synchronized void setRecordLocation(String locator) throws IOException, MediaException {
        if (player == null)
            return;

        if (recordRequested)
    	    throw new IllegalStateException("startRecord has been called and commit has not been called");
    	
    	if (stream != null)
    	    throw new IllegalStateException("setRecordStream has been called and commit has not been called");
    	
    	if (locator == null)
    	    throw new IllegalArgumentException("null locator specified");

        // Check about the string. Is this URL format?
        int colonIndex = locator.indexOf(":");
    	if (colonIndex < 0) {
    	    throw new MediaException("Invalid locator " + locator);
    	}

        // Check for record permissions
	    checkPermission();

        // Query if native function can handle this locator
        int ret = nSetLocator(player.hNative, locator);
        if (-1 == ret) {
            throw new MediaException("setRecordLocation: invalid locator " + locator);
        } else if (0 == ret) {

            




            if (!(locator.startsWith("http:") || locator.startsWith("https:"))) {
                throw new MediaException("Unsupported protocol");
            }
            
        
            if (locator.startsWith("http:")) {
        	    try {
        	        httpCon = (HttpConnection)Connector.open(locator);
        	    } catch (IllegalArgumentException e) {
        	        throw new MediaException(e.getMessage());
        	    } catch (ConnectionNotFoundException e) {
        	        throw new IOException(e.getMessage());
        	    }
        	    httpCon.setRequestMethod(HttpConnection.POST);
        	    httpCon.setRequestProperty("Content-Type", "audio/wav");

        	    stream = httpCon.openOutputStream();
                    extStream = false;
            } else if (locator.startsWith("https:")) {
        	    try {
        	        httpsCon = (HttpsConnection)Connector.open(locator);
        	    } catch (IllegalArgumentException e) {
        	        throw new MediaException(e.getMessage());
        	    } catch (ConnectionNotFoundException e) {
        	        throw new IOException(e.getMessage());
        	    }
        	    httpsCon.setRequestMethod(HttpConnection.POST);
        	    httpsCon.setRequestProperty("Content-Type", "audio/wav");

        	    stream = httpsCon.openOutputStream();
                    extStream = false;
            }

            

























            recordingByNative = false;
        } else {
            stream = null;
            recordingByNative = true;
        }
        this.locator = locator;
    }
    
    /**
     * Start recording
     */
    public synchronized void startRecord() throws IllegalStateException {
        if ((locator == null) && (stream == null)) {
	        throw new
                IllegalStateException("Should call setRecordLocation or setRecordStream before calling startRecord");
	    }

        if (recordRequested == true || player == null) {
            return;
        }

        recordRequested = true;

        if (player.getState() == Player.STARTED) {
            if (1 == nStart(player.hNative)) {
                recording = true;
                player.sendEvent(PlayerListener.RECORD_STARTED, new Long(player.getMediaTime()));
            } else {
                player.sendEvent(PlayerListener.RECORD_ERROR, new String("Can't start recording"));
            }
        } else {
            suspended = true;
        }
	}

    /**
     * Stop or pause recording
     */
	private synchronized void stopRecord(boolean pause) {
	    if (player == null)
            return;

    	if (recordRequested == true) {
    	    recordRequested = false;
    	    if (recording == true) {
                if (suspended == false) {
                    if (pause) 
                        nPause(player.hNative);
                    else 
                        nStop(player.hNative);
                }
                player.sendEvent(PlayerListener.RECORD_STOPPED, new Long(player.getMediaTime()));
    		    recording = false;
                hasDataToCommit = true;
    	    }
        }
	}

    /**
     * Stop recording
     */
    public void stopRecord() {
        // pause
        stopRecord(true);
    }

    /**
     * Commit the current recording
     */
    public synchronized void commit() throws IOException {
        if (stream == null && locator == null) {
    	    return;
    	}

        if (player == null || 0 == player.hNative) {
            return;
        }

        // stop
        stopRecord(false);

        if( hasDataToCommit )
        {
            if (1 != nCommit(player.hNative)) {
                cleanUp();
                throw new IOException("I/O error occurs during commit");
            }

            // Get recorded data
            if (stream != null) {
                int offset = 0;
                int getSize = 1024 * 50;    // 50 Kbytes
                if (httpCon != null || httpsCon != null) {
                    getSize = 100;          // 100 bytes
                }
                dataBuffer = new byte[getSize];
                int size = nGetRecordedSize(player.hNative);

                if (Logging.REPORT_LEVEL <= Logging.INFORMATION) {
                    Logging.report(Logging.INFORMATION, LogChannels.LC_MMAPI, 
                        "Recorded data size is " + size);
                }

                while (size >= getSize) {
                    if (1 != nGetRecordedData(player.hNative, offset, getSize, dataBuffer)) {
                        cleanUp();
                        throw new IOException("I/O error occurs during commit");
                    }
                    size -= getSize;
                    offset += getSize;
                    // Write to stream
                    stream.write(dataBuffer);
                    stream.flush();
                }

                if (size > 0) {
                    dataBuffer = new byte[size];
                    if (1 != nGetRecordedData(player.hNative, offset, size, dataBuffer)) {
                        cleanUp();
                        throw new IOException("I/O error occurs during commit");
                    }
                    stream.write(dataBuffer);
                    stream.flush();
                }
            } else if (locator != null && recordingByNative == false) {
                // Need revisit
            }
        }

        // Release native resources
        nClose(player.hNative);

        if (locator != null) {
            if (httpCon != null) {
                int rescode = httpCon.getResponseCode();
                if (rescode != HttpConnection.HTTP_OK) {
                    cleanUp();
                    throw new IOException("HTTP response code: " + rescode);
                }
            } else if (httpsCon != null) {
                int rescode = httpsCon.getResponseCode();
                if (rescode != HttpConnection.HTTP_OK) {
                    cleanUp();
                    throw new IOException("HTTP response code: " + rescode);
                }
            }
        }

        cleanUp();

        // We're done. 
        dataBuffer = null;
        locator = null;
        recordingByNative = false;
        hasDataToCommit = false;
    }

    /**
     * Reset the current recording
     */
    public synchronized void reset() throws IOException {
        if (player == null)
            return;

        if (recordRequested == true) {
            stopRecord(false);
            if (1 != nReset(player.hNative)) {
                cleanUp();
                throw new IOException("The current recording cannot be erased");
            }
        } else {
            stopRecord(false);
        }
        hasDataToCommit = false;
    }

    /**
     * Set record size limit
     */
    public synchronized int setRecordSizeLimit(int size) throws MediaException {
        if (player == null)
            return 0;

        if (size <= 0)
            throw new IllegalArgumentException("Given size is invalid");

        if (Integer.MAX_VALUE == size) {
            nSetSizeLimit(player.hNative, -1);
        } else {
            size = nSetSizeLimit(player.hNative, size);
            if (size == 0) {
                throw new MediaException("Setting the record size limit is not supported");
            }
        }

        // If the requested size is less than the already recorded size, commit
        if (recording == true) {
            int recordedSize = nGetRecordedSize(player.hNative);
            if (recordedSize > size) {
                try {
                    commit();
                } catch(IOException e) {
                    // Nothing to do
                }
            }
        }

        return size;
    }

    /**
     * Get content type
     */
    public String getContentType() {
        return nGetRecordedType(player.hNative);
    }
    
    ///////////////////////////////////////////////////////////////

    public synchronized void recordSizeLimitReached()
    {
        if (Logging.REPORT_LEVEL <= Logging.INFORMATION) {
            Logging.report(Logging.INFORMATION, LogChannels.LC_MMAPI,
            "[direct] received RSL");
        }
        try
        {
            commit();
        }
        catch( java.io.IOException e )
        {
        }
    }

    // Is recording suspended by player?
    private boolean suspended = false;

    /**
     * Start recording (from Player object)
     */
    public synchronized void playerStarted() {
        // Automatically resume recording from Player
        if (suspended) {
            if (1 == nStart(player.hNative)) {
                recording = true;
                player.sendEvent(PlayerListener.RECORD_STARTED, new Long(player.getMediaTime()));
            } else {
                player.sendEvent(PlayerListener.RECORD_ERROR, new String("Can't start recording"));
            }
            
            suspended = false;
            
            return;
        }

        if (recordRequested && !recording) {
            if (1 == nStart(player.hNative)) {
                recording = true;
                player.sendEvent(PlayerListener.RECORD_STARTED, new Long(player.getMediaTime()));
            } else {
                player.sendEvent(PlayerListener.RECORD_ERROR, new String("Can't start recording"));
            }
	    }
    }

    /**
     * Suspend recording (from Player object)
     */
    public synchronized void playerStopped() {
        if (recording) {
            stopRecord();
            suspended = true;
        }
    }

    /**
     * Player closed. reset recording.
     */
    public synchronized void playerClosed() {
        try {
            reset();
            nClose(player.hNative);
        } catch(IOException e) {
            // Nothing to do
        }
        player = null;
        cleanUp();
    }

    /**
     * Clean up connection resources if any
     */
    private void cleanUp() {
        try {
            if (stream != null && !extStream) {
                stream.close();
            }
        } catch(Exception e) {
        }

        try {
            if (httpCon != null) {
                httpCon.close();
            }
        } catch(Exception e) {
        }

        try {
            if (httpsCon != null) {
                httpsCon.close();
            }
        } catch(Exception e) {
        }
            
        








        stream = null;
        httpCon = null;
        httpsCon = null;

        


    }

    /**
     * Check for the multimedia record permission.
     *
     * @exception SecurityException if the permission is not
     *            allowed by this token
     */
    private void checkPermission() {
    	try {
            PermissionAccessor.checkPermissions(player.getLocator(), PermissionAccessor.PERMISSION_RECORDING);
    	} catch (InterruptedException e) {
    	    throw new SecurityException("Interrupted while trying to ask the user permission");
    	}
    }
    
    ///////////////////////////////////////////////////////////////

    /* The string in URL format specifying where the recorded media will be saved */
    private String locator; // null;
    /* Set the output stream where the data will be recorded. */
    private OutputStream stream; // null
    private BasicPlayer player; // null;
    /* specifies whether recording is requested via <code>startRecord</code> */
    private boolean recordRequested; // false;
    /* This is set to true when recording starts (RECORD_STARTED event
     * is posted). Is set to false when recording stops (RECORD_STOPPED event
     * is posted).
     */
    private boolean recording; // false;
    /* This recording handled by native API layer? */
    private boolean recordingByNative; // false
    /* Recording data buffer */
    private byte[] dataBuffer;
    
    /* External Output Stream flag */
    private boolean extStream = false;

    private boolean hasDataToCommit=false;

    



    private HttpConnection httpCon;
    private HttpsConnection httpsCon;
}
