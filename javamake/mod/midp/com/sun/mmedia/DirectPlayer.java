package com.sun.mmedia;

import com.sun.j2me.log.Logging;
import com.sun.midp.log.LogChannels;
import com.sun.mmedia.protocol.BasicDS;
import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;
import javax.microedition.media.Control;
import javax.microedition.media.MediaException;
import javax.microedition.media.PlayerListener;

public class DirectPlayer extends BasicPlayer implements VideoSource {
    private static byte[] buffer;
    DirectVolume dVolumeControl;
    DirectMetaData dMetaDataControl;
    private long remained;
    private Timer stopTimer;
    private static final long STOP_TIME_ADVANCE = 100;
    private DirectMIDIControl midiControl;
    private Control tunerControl;
    private Control rdsControl;
    private boolean isWaitingForSnapshot;
    private DirectRecord recordControl = null;
    private boolean isStreaming = false;
    private boolean isFirstStart = true;
    protected boolean wholeDataDownloaded = false;
    private boolean hasTakenRadioAccess = false;
    private DirectVideo videoControl = null;
    private Object snapshotLock = new Object();
    private boolean colorKeyOn = false;

    public class StopTimeController extends TimerTask {
        StopTimeController() {
        }

        
        public void run() {
            synchronized (DirectPlayer.this) {
                long doGetMediaTime = DirectPlayer.this.doGetMediaTime();
                long doGetDuration = DirectPlayer.this.doGetDuration();
                while (doGetMediaTime != -1 && doGetMediaTime < DirectPlayer.this.stopTime && (doGetDuration <= 0 || doGetMediaTime < doGetDuration)) {
                    try {
                        Thread.sleep(10L);
                    } catch (InterruptedException e) {
                    }
                    doGetMediaTime = DirectPlayer.this.doGetMediaTime();
                }
                try {
                    DirectPlayer.this.doPreStop();
                    DirectPlayer.this.doStop();
                } catch (MediaException e2) {
                    Logging.report(2, LogChannels.LC_MMAPI, "Exception during stop by stop timer");
                }
            }
            DirectPlayer.this.satev();
        }
    }

    protected native int nTerm(int i);

    protected native String nGetContentType(int i);

    private native boolean nAcquireRadioAccess();

    protected native boolean nAcquireDevice(int i);

    protected native void nReleaseDevice(int i);

    private native void nReleaseRadioAccess();

    protected native boolean nFlushBuffer(int i);

    protected native boolean nStart(int i);

    protected native boolean nStop(int i);

    protected native int nGetMediaTime(int i);

    protected native int nSetMediaTime(int i, long j);

    protected native int nGetDuration(int i);

    protected native boolean nPause(int i);

    protected native boolean nResume(int i);

    protected native boolean nIsNeedBuffering(int i);

    private native boolean nSwitchToForeground(int i, int i2);

    private native boolean nSwitchToBackground(int i, int i2);

    private native void finalize();

    private native boolean nPcmAudioPlayback(int i);

    protected native boolean nPrefetch(int i);

    protected static native boolean nIsFramePositioningControlSupported(int i);

    protected static native boolean nIsMetaDataControlSupported(int i);

    public static native boolean nIsMIDIControlSupported(int i);

    protected static native boolean nIsPitchControlSupported(int i);

    protected static native boolean nIsRateControlSupported(int i);

    protected static native boolean nIsRecordControlSupported(int i);

    protected static native boolean nIsStopTimeControlSupported(int i);

    protected static native boolean nIsTempoControlSupported(int i);

    protected static native boolean nIsVideoControlSupported(int i);

    public static native boolean nIsToneControlSupported(int i);

    protected static native boolean nIsVolumeControlSupported(int i);

    protected native int nGetWidth(int i);

    protected native int nGetHeight(int i);

    protected native boolean nSetLocation(int i, int i2, int i3, int i4, int i5);

    protected native void nStartSnapshot(int i, String str);

    protected native byte[] nGetSnapshotData(int i);

    protected native boolean nSetFullScreenMode(int i, boolean z);

    protected native boolean nSetVisible(int i, boolean z);

    private native boolean nSetColorKey(int i, boolean z, int i2);

    public int getNativeHandle() {
        return this.hNative;
    }

    
    protected void doSetStopTime(long j) {
        if (j == Long.MAX_VALUE && this.stopTimer != null) {
            this.stopTimer.cancel();
            this.stopTimer = null;
        } else {
            if (j == Long.MAX_VALUE || this.state != 400 || j < doGetMediaTime()) {
                return;
            }
            scheduleStopTimer(j);
        }
    }

    private boolean scheduleStopTimer(long j) {
        long j2 = 100000;
        long j3 = 100000;
        boolean z = false;
        boolean z2 = false;
        boolean z3 = false;
        doGetDuration();
        long doGetMediaTime = doGetMediaTime();
        if (doGetMediaTime == -1) {
            return false;
        }
        if (this.hNative != 0) {
            z = nIsRateControlSupported(this.hNative);
            z2 = nIsTempoControlSupported(this.hNative);
        }
        if (this.midiControl == null && (z || z2)) {
            this.midiControl = new DirectMIDIControl(this);
        }
        if (this.midiControl != null) {
            if (z) {
                j3 = this.midiControl.getRateControl().getRate();
            }
            if (z2) {
                j2 = this.midiControl.getTempoControl().getTempo();
            }
        }
        if (this.stopTimer != null) {
            this.stopTimer.cancel();
            this.stopTimer = null;
        }
        long j4 = (((((j - doGetMediaTime) - STOP_TIME_ADVANCE) / 1000) * 100000) * 100000) / (j3 * j2);
        if (j4 <= 0) {
            synchronized (this) {
                try {
                    doPreStop();
                    doStop();
                } catch (MediaException e) {
                    Logging.report(2, LogChannels.LC_MMAPI, "Exception during stop by stop timer");
                }
            }
            satev();
            z3 = true;
        } else {
            this.stopTimer = new Timer();
            this.stopTimer.schedule(new StopTimeController(), j4);
        }
        return z3;
    }

    
    protected void doRealize() throws MediaException {
        this.isStreaming = isStreamingSource();
        if (isVideoPlayer()) {
            this.videoControl = new DirectVideo(this, nGetWidth(this.hNative), nGetHeight(this.hNative));
        }
    }

    private boolean isRadioPlayer() {
        return null != this.source.getLocator() && this.source.getLocator().startsWith(Configuration.RADIO_CAPTURE_LOCATOR);
    }

    private void prefetchData() throws MediaException {
        if (!nPrefetch(this.hNative)) {
            throw new MediaException("Can not prefetch");
        }
        if (this.handledByDevice || this.mediaDownload == null) {
            return;
        }
        try {
            this.mediaDownload.fgDownload();
        } catch (IOException e) {
            throw new MediaException("Can not start media download thread : " + e);
        }
    }

    private void acquireDevice() throws MediaException {
        if (isRadioPlayer()) {
            if (!nAcquireRadioAccess()) {
                throw new MediaException("Radio Tuner is already used by a Java Player");
            }
            this.hasTakenRadioAccess = true;
        }
        if (nAcquireDevice(this.hNative)) {
            return;
        }
        releaseRadioAccess();
        throw new MediaException("Can not acquire device");
    }

    
    protected void doPrefetch() throws MediaException {
        prefetchData();
        acquireDevice();
        if (nPcmAudioPlayback(this.hNative)) {
            AudioTunnel.getInstance().start();
        }
    }

    
    public void doReceiveRSL() {
        if (this.recordControl != null) {
            this.recordControl.recordSizeLimitReached();
        }
    }

    
    protected void doPostStart() {
        if (this.dVolumeControl != null) {
            this.dVolumeControl.setToThisPlayerLevel();
            this.dVolumeControl.setToPlayerMute();
        }
        if (this.stopTime == Long.MAX_VALUE || !scheduleStopTimer(this.stopTime)) {
            if (this.recordControl != null) {
                this.recordControl.playerStarted();
            }
            if (this.midiControl != null) {
                this.midiControl.playerStarted();
            }
            if (this.mediaDownload != null) {
                try {
                    this.mediaDownload.bgDownload();
                } catch (Exception e) {
                    try {
                        stop();
                    } catch (MediaException e2) {
                    }
                }
            }
        }
    }

    
    protected boolean doStart() {
        boolean nStart;
        if (null != this.videoControl) {
            this.videoControl.start();
        }
        if (this.isFirstStart || 0 == getMediaTime()) {
            nStart = nStart(this.hNative);
            this.isFirstStart = false;
        } else {
            nStart = nResume(this.hNative);
        }
        return nStart;
    }

    
    public void continueDownload() {
        if (this.mediaDownload != null) {
            this.mediaDownload.continueDownload();
        }
    }

    
    protected long doGetMediaTime() {
        int nGetMediaTime = nGetMediaTime(this.hNative);
        return ((long) nGetMediaTime) != -1 ? nGetMediaTime * 1000 : nGetMediaTime;
    }

    
    protected void doPreStop() {
        if (this.stopTimer != null) {
            this.stopTimer.cancel();
            this.stopTimer = null;
        }
        if (this.recordControl != null) {
            this.recordControl.playerStopped();
        }
        if (this.midiControl != null) {
            this.midiControl.playerStopped();
        }
    }

    
    protected void doStop() throws MediaException {
        if (null != this.videoControl) {
            this.videoControl.stop();
        }
        if (false == nPause(this.hNative)) {
            throw new MediaException("Player cannot be stopped");
        }
    }

    private void releaseRadioAccess() {
        if (isRadioPlayer()) {
            nReleaseRadioAccess();
            this.hasTakenRadioAccess = false;
        }
    }

    
    protected void doDeallocate() {
        if (nPcmAudioPlayback(this.hNative)) {
            AudioTunnel.getInstance().stop();
        }
        releaseRadioAccess();
        if (this.mediaDownload != null) {
            this.mediaDownload.deallocate();
        }
        nReleaseDevice(this.hNative);
        this.isFirstStart = true;
    }

    
    protected void doClose() {
        if (null != this.videoControl) {
            this.videoControl.close();
            this.videoControl = null;
        }
        if (this.recordControl != null) {
            this.recordControl.playerClosed();
            this.recordControl = null;
        }
        if (this.midiControl != null) {
            this.midiControl.playerClosed();
            this.midiControl = null;
        }
        if (this.dMetaDataControl != null) {
            this.dMetaDataControl.playerClosed();
            this.dMetaDataControl = null;
        }
        if (this.dVolumeControl != null) {
            this.dVolumeControl.playerClosed();
            this.dVolumeControl = null;
        }
        if (this.hNative != 0) {
            if (true == nIsNeedBuffering(this.hNative)) {
                nFlushBuffer(this.hNative);
            }
            nTerm(this.hNative);
            this.hNative = 0;
        }
    }

    
    protected long doSetMediaTime(long j) throws MediaException {
        if (j <= 0) {
            j = 0;
        }
        long doGetDuration = doGetDuration();
        if (-1 != doGetDuration && j > doGetDuration) {
            j = doGetDuration;
        }
        if (nSetMediaTime(this.hNative, j / 1000) == -1) {
            throw new MediaException("media time cannot be set");
        }
        return j * 1000;
    }

    
    protected long doGetDuration() {
        if (isCapturePlayer()) {
            return -1L;
        }
        if (isDevicePlayer() && !this.hasToneSequenceSet) {
            return 0L;
        }
        int nGetDuration = nGetDuration(this.hNative);
        return ((long) nGetDuration) != -1 ? nGetDuration * 1000 : nGetDuration;
    }

    
    public Control doGetControl(String str) {
        String str2 = str;
        if (str.startsWith("javax.microedition.media.control.")) {
            str2 = str.substring("javax.microedition.media.control.".length());
        }
        if (!str2.equals("FramePositioningControl")) {
            if (str2.equals("MetaDataControl")) {
                if (nIsMetaDataControlSupported(this.hNative)) {
                    if (this.dMetaDataControl == null) {
                        this.dMetaDataControl = new DirectMetaData(this.hNative);
                    }
                    return this.dMetaDataControl;
                }
            } else if (str2.equals("MIDIControl")) {
                if (nIsMIDIControlSupported(this.hNative)) {
                    if (this.midiControl == null) {
                        this.midiControl = new DirectMIDIControl(this);
                    }
                    return this.midiControl.getMIDIControl();
                }
            } else if (str2.equals("PitchControl")) {
                if (nIsPitchControlSupported(this.hNative)) {
                    if (this.midiControl == null) {
                        this.midiControl = new DirectMIDIControl(this);
                    }
                    return this.midiControl.getPitchControl();
                }
            } else if (str2.equals("RateControl")) {
                if (nIsRateControlSupported(this.hNative)) {
                    if (this.midiControl == null) {
                        this.midiControl = new DirectMIDIControl(this);
                    }
                    return this.midiControl.getRateControl();
                }
            } else if (str2.equals("RecordControl")) {
                if (nIsRecordControlSupported(this.hNative)) {
                    if (this.recordControl == null) {
                        this.recordControl = new DirectRecord(this);
                    }
                    return this.recordControl;
                }
            } else if (str2.equals("StopTimeControl")) {
                if (!isCapturePlayer()) {
                    return this;
                }
            } else if (str2.equals("TempoControl")) {
                if (nIsTempoControlSupported(this.hNative)) {
                    if (this.midiControl == null) {
                        this.midiControl = new DirectMIDIControl(this);
                    }
                    return this.midiControl.getTempoControl();
                }
            } else if (!str2.equals("VideoControl") && !str2.equals("ToneControl") && str2.equals("VolumeControl") && nIsVolumeControlSupported(this.hNative)) {
                if (this.dVolumeControl == null) {
                    this.dVolumeControl = new DirectVolume(this, this.hNative);
                }
                return this.dVolumeControl;
            }
        }
        if (null == this.videoControl || (!str2.equals("VideoControl") && !str2.equals("GUIControl"))) {
            if (!isRadioPlayer()) {
                return null;
            }
            if (str.equals("javax.microedition.amms.control.tuner.RDSControl")) {
                if (null == this.rdsControl) {
                    this.rdsControl = Jsr234Proxy.getInstance().getRDSControl(this);
                }
                return this.rdsControl;
            }
            if (!str.equals("javax.microedition.amms.control.tuner.TunerControl")) {
                return null;
            }
            if (null == this.tunerControl) {
                this.tunerControl = Jsr234Proxy.getInstance().getTunerControl(this);
            }
            return this.tunerControl;
        }
        return this.videoControl;
    }

    private boolean isStreamingSource() {
        String locator;
        String lowerCase;
        int indexOf;
        String str = null;
        if (this.source != null && (locator = this.source.getLocator()) != null && (indexOf = (lowerCase = locator.toLowerCase()).indexOf(58)) != -1) {
            str = lowerCase.substring(0, indexOf);
        }
        return str != null && str.equals("rtsp");
    }

    private void processHeader(byte[] bArr, int i) {
        if (this.source != null) {
            String contentType = getContentType();
            BasicDS basicDS = (BasicDS) this.source;
            if (basicDS == null || !contentType.equals("audio/midi")) {
                return;
            }
            int i2 = i - 5;
            if (i2 > 512) {
                i2 = 512;
            }
            for (int i3 = 0; i3 < i2; i3++) {
                if (bArr[i3] == -16 && bArr[i3 + 2] == Byte.MAX_VALUE && bArr[i3 + 4] == 11 && bArr[i3 + 5] == 1) {
                    basicDS.setContentType(Configuration.MIME_AUDIO_SP_MIDI);
                    return;
                }
            }
        }
    }

    
    public String getContentType() {
        int indexOf;
        String contentType = super.getContentType();
        if (null == contentType) {
            contentType = nGetContentType(this.hNative);
            if (null != contentType && -1 != (indexOf = contentType.indexOf(32))) {
                contentType = contentType.substring(0, indexOf);
            }
            if (contentType == null && this.source != null) {
                contentType = DefaultConfiguration.getContentType(this.source.getLocator());
            }
        }
        return contentType;
    }

    private boolean isVideoPlayer() {
        return nIsVideoControlSupported(this.hNative);
    }

    public void setSnapshotQuality(int i) {
    }

    public void checkSnapshotPermission() {
        try {
            PermissionAccessor.checkPermissions(getLocator(), 7);
        } catch (InterruptedException e) {
            throw new SecurityException("Interrupted while trying to ask the user permission");
        }
    }

    
    public boolean setVideoLocation(int i, int i2, int i3, int i4) {
        return nSetLocation(this.hNative, i, i2, i3, i4);
    }

    
    public synchronized byte[] getVideoSnapshot(String str) throws MediaException {
        byte[] nGetSnapshotData;
        checkSnapshotPermission();
        try {
            synchronized (this.snapshotLock) {
                nStartSnapshot(this.hNative, str);
                this.isWaitingForSnapshot = true;
                this.snapshotLock.wait(10000L);
                if (this.isWaitingForSnapshot) {
                    this.isWaitingForSnapshot = false;
                    throw new MediaException("Timed out while making a Camera Snapshot");
                }
                nGetSnapshotData = nGetSnapshotData(this.hNative);
            }
            return nGetSnapshotData;
        } catch (InterruptedException e) {
            throw new MediaException("Camera Snapshot was interrupted by user: " + e.toString());
        }
    }

    public void notifySnapshotFinished() {
        synchronized (this.snapshotLock) {
            if (this.isWaitingForSnapshot) {
                this.snapshotLock.notify();
                this.isWaitingForSnapshot = false;
            }
        }
    }

    
    public boolean setVideoFullScreen(boolean z) {
        return nSetFullScreenMode(this.hNative, z);
    }

    
    public boolean setVideoVisible(boolean z) {
        return nSetVisible(this.hNative, z);
    }

    
    public boolean setColorKey(boolean z, int i) {
        if (this.colorKeyOn == z) {
            return true;
        }
        this.colorKeyOn = z;
        return nSetColorKey(this.hNative, z, i);
    }

    
    public void notifyDisplaySizeChange() {
        sendEvent(PlayerListener.SIZE_CHANGED, this.videoControl);
    }
}