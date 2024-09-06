package com.sun.mmedia;

import java.io.IOException;
import java.io.OutputStream;
import javax.microedition.io.ConnectionNotFoundException;
import javax.microedition.io.Connector;
import javax.microedition.io.HttpConnection;
import javax.microedition.io.HttpsConnection;
import javax.microedition.io.file.FileConnection;
import javax.microedition.media.MediaException;
import javax.microedition.media.control.RecordControl;

public final class DirectRecord implements RecordControl, DirectControls {
    private String locator;
    private OutputStream stream;
    private BasicPlayer player;
    private boolean recordRequested;
    private boolean recording;
    private boolean recordingByNative;
    private byte[] dataBuffer;
    private FileConnection fileCon;
    private HttpConnection httpCon;
    private HttpsConnection httpsCon;
    private boolean suspended = false;
    private boolean extStream = false;
    private boolean hasDataToCommit = false;

    private native int nSetLocator(int i, String str);

    private native int nStart(int i);

    private native int nStop(int i);

    private native int nPause(int i);

    private native int nCommit(int i);

    private native int nReset(int i);

    private native int nClose(int i);

    private native int nSetSizeLimit(int i, int i2);

    private native int nGetRecordedSize(int i);

    private native int nGetRecordedData(int i, int i2, int i3, byte[] bArr);

    private native String nGetRecordedType(int i);

    private native void finalize();

    public DirectRecord(BasicPlayer basicPlayer) {
        this.player = basicPlayer;
    }

    
    public synchronized void setRecordStream(OutputStream outputStream) {
        if (this.recordRequested) {
            throw new IllegalStateException("startRecord has been called and commit has not been called");
        }
        if (this.locator != null) {
            throw new IllegalStateException("setRecordLocation has been called and commit has not been called");
        }
        if (outputStream == null) {
            throw new IllegalArgumentException("null stream specified");
        }
        checkPermission();
        this.recordingByNative = false;
        this.locator = null;
        this.stream = outputStream;
        this.extStream = true;
    }

    
    public synchronized void setRecordLocation(String str) throws IOException, MediaException {
        if (this.player == null) {
            return;
        }
        if (this.recordRequested) {
            throw new IllegalStateException("startRecord has been called and commit has not been called");
        }
        if (this.stream != null) {
            throw new IllegalStateException("setRecordStream has been called and commit has not been called");
        }
        if (str == null) {
            throw new IllegalArgumentException("null locator specified");
        }
        int indexOf = str.indexOf(":");
        if (indexOf < 0) {
            throw new MediaException(new StringBuffer().append("Invalid locator ").append(str).toString());
        }
        checkPermission();
        int nSetLocator = nSetLocator(this.player.hNative, str);
        if (-1 == nSetLocator) {
            throw new MediaException(new StringBuffer().append("setRecordLocation: invalid locator ").append(str).toString());
        }
        if (0 != nSetLocator) {
            this.stream = null;
            this.recordingByNative = true;
        } else {
            if (!str.startsWith("file:") && !str.startsWith("http:") && !str.startsWith("https:")) {
                throw new MediaException("Unsupported protocol");
            }
            if (str.startsWith("http:")) {
                try {
                    this.httpCon = (HttpConnection) Connector.open(str);
                    this.httpCon.setRequestMethod(HttpConnection.POST);
                    this.httpCon.setRequestProperty("Content-Type", "audio/wav");
                    this.stream = this.httpCon.openOutputStream();
                    this.extStream = false;
                } catch (IllegalArgumentException e) {
                    throw new MediaException(e.getMessage());
                } catch (ConnectionNotFoundException e2) {
                    throw new IOException(e2.getMessage());
                }
            } else if (str.startsWith("https:")) {
                try {
                    this.httpsCon = (HttpsConnection) Connector.open(str);
                    this.httpsCon.setRequestMethod(HttpConnection.POST);
                    this.httpsCon.setRequestProperty("Content-Type", "audio/wav");
                    this.stream = this.httpsCon.openOutputStream();
                    this.extStream = false;
                } catch (IllegalArgumentException e3) {
                    throw new MediaException(e3.getMessage());
                } catch (ConnectionNotFoundException e4) {
                    throw new IOException(e4.getMessage());
                }
            }
            if (str.startsWith("file:")) {
                if (str.substring(indexOf + 1).length() <= 0) {
                    throw new MediaException(new StringBuffer().append("setRecordLocation: invalid locator ").append(str).toString());
                }
                try {
                    this.fileCon = (FileConnection) Connector.open(str, 3);
                    if (this.fileCon.exists()) {
                        this.fileCon.truncate(0L);
                    } else {
                        this.fileCon.create();
                    }
                    this.stream = this.fileCon.openOutputStream();
                    this.extStream = false;
                } catch (IllegalArgumentException e5) {
                    throw new MediaException(e5.getMessage());
                } catch (ConnectionNotFoundException e6) {
                    throw new IOException(e6.getMessage());
                }
            }
            this.recordingByNative = false;
        }
        this.locator = str;
    }

    
    public synchronized void startRecord() throws IllegalStateException {
        if (this.locator == null && this.stream == null) {
            throw new IllegalStateException("Should call setRecordLocation or setRecordStream before calling startRecord");
        }
        if (this.recordRequested || this.player == null) {
            return;
        }
        this.recordRequested = true;
        if (this.player.getState() != 400) {
            this.suspended = true;
        } else if (1 != nStart(this.player.hNative)) {
            this.player.sendEvent("recordError", new String("Can't start recording"));
        } else {
            this.recording = true;
            this.player.sendEvent("recordStarted", new Long(this.player.getMediaTime()));
        }
    }

    private synchronized void stopRecord(boolean z) {
        if (this.player != null && this.recordRequested) {
            this.recordRequested = false;
            if (this.recording) {
                if (!this.suspended) {
                    if (z) {
                        nPause(this.player.hNative);
                    } else {
                        nStop(this.player.hNative);
                    }
                }
                this.player.sendEvent("recordStopped", new Long(this.player.getMediaTime()));
                this.recording = false;
                this.hasDataToCommit = true;
            }
        }
    }

    
    public void stopRecord() {
        stopRecord(true);
    }

    
    public synchronized void commit() throws IOException {
        int responseCode;
        if ((this.stream == null && this.locator == null) || this.player == null || 0 == this.player.hNative) {
            return;
        }
        stopRecord(false);
        if (this.hasDataToCommit) {
            if (1 != nCommit(this.player.hNative)) {
                cleanUp();
                throw new IOException("I/O error occurs during commit");
            }
            if (this.stream != null) {
                int i = 0;
                int i2 = 51200;
                if (this.httpCon != null || this.httpsCon != null) {
                    i2 = 100;
                }
                this.dataBuffer = new byte[i2];
                int nGetRecordedSize = nGetRecordedSize(this.player.hNative);
                while (nGetRecordedSize >= i2) {
                    if (1 != nGetRecordedData(this.player.hNative, i, i2, this.dataBuffer)) {
                        cleanUp();
                        throw new IOException("I/O error occurs during commit");
                    }
                    nGetRecordedSize -= i2;
                    i += i2;
                    this.stream.write(this.dataBuffer);
                    this.stream.flush();
                }
                if (nGetRecordedSize > 0) {
                    this.dataBuffer = new byte[nGetRecordedSize];
                    if (1 != nGetRecordedData(this.player.hNative, i, nGetRecordedSize, this.dataBuffer)) {
                        cleanUp();
                        throw new IOException("I/O error occurs during commit");
                    }
                    this.stream.write(this.dataBuffer);
                    this.stream.flush();
                }
            } else if (this.locator == null || !this.recordingByNative) {
            }
        }
        nClose(this.player.hNative);
        if (this.locator != null) {
            if (this.httpCon != null) {
                int responseCode2 = this.httpCon.getResponseCode();
                if (responseCode2 != 200) {
                    cleanUp();
                    throw new IOException(new StringBuffer().append("HTTP response code: ").append(responseCode2).toString());
                }
            } else if (this.httpsCon != null && (responseCode = this.httpsCon.getResponseCode()) != 200) {
                cleanUp();
                throw new IOException(new StringBuffer().append("HTTP response code: ").append(responseCode).toString());
            }
        }
        cleanUp();
        this.dataBuffer = null;
        this.locator = null;
        this.recordingByNative = false;
        this.hasDataToCommit = false;
    }

    
    public synchronized void reset() throws IOException {
        if (this.player == null) {
            return;
        }
        if (this.recordRequested) {
            stopRecord(false);
            if (1 != nReset(this.player.hNative)) {
                cleanUp();
                throw new IOException("The current recording cannot be erased");
            }
        } else {
            stopRecord(false);
        }
        this.hasDataToCommit = false;
    }

    
    public synchronized int setRecordSizeLimit(int i) throws MediaException {
        if (this.player == null) {
            return 0;
        }
        if (i <= 0) {
            throw new IllegalArgumentException("Given size is invalid");
        }
        if (Integer.MAX_VALUE == i) {
            nSetSizeLimit(this.player.hNative, -1);
        } else {
            i = nSetSizeLimit(this.player.hNative, i);
            if (i == 0) {
                throw new MediaException("Setting the record size limit is not supported");
            }
        }
        if (this.recording && nGetRecordedSize(this.player.hNative) > i) {
            try {
                commit();
            } catch (IOException e) {
            }
        }
        return i;
    }

    
    public String getContentType() {
        return nGetRecordedType(this.player.hNative);
    }

    public synchronized void recordSizeLimitReached() {
        try {
            commit();
        } catch (IOException e) {
        }
    }

    
    public synchronized void playerStarted() {
        if (this.suspended) {
            if (1 == nStart(this.player.hNative)) {
                this.recording = true;
                this.player.sendEvent("recordStarted", new Long(this.player.getMediaTime()));
            } else {
                this.player.sendEvent("recordError", new String("Can't start recording"));
            }
            this.suspended = false;
            return;
        }
        if (!this.recordRequested || this.recording) {
            return;
        }
        if (1 != nStart(this.player.hNative)) {
            this.player.sendEvent("recordError", new String("Can't start recording"));
        } else {
            this.recording = true;
            this.player.sendEvent("recordStarted", new Long(this.player.getMediaTime()));
        }
    }

    
    public synchronized void playerStopped() {
        if (this.recording) {
            stopRecord();
            this.suspended = true;
        }
    }

    
    public synchronized void playerClosed() {
        try {
            reset();
            nClose(this.player.hNative);
        } catch (IOException e) {
        }
        this.player = null;
        cleanUp();
    }

    private void cleanUp() {
        try {
            if (this.stream != null && !this.extStream) {
                this.stream.close();
            }
        } catch (Exception e) {
        }
        try {
            if (this.httpCon != null) {
                this.httpCon.close();
            }
        } catch (Exception e2) {
        }
        try {
            if (this.httpsCon != null) {
                this.httpsCon.close();
            }
        } catch (Exception e3) {
        }
        try {
            if (this.fileCon != null) {
                this.fileCon.close();
            }
        } catch (Exception e4) {
        }
        this.stream = null;
        this.httpCon = null;
        this.httpsCon = null;
        this.fileCon = null;
    }

    private void checkPermission() {
        try {
            PermissionAccessor.checkPermissions(this.player.getLocator(), 8);
        } catch (InterruptedException e) {
            throw new SecurityException("Interrupted while trying to ask the user permission");
        }
    }
}