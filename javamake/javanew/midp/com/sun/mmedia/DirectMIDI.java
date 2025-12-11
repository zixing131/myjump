package com.sun.mmedia;

import com.sun.midp.configurator.Constants;
import java.io.IOException;
import javax.microedition.media.Control;
import javax.microedition.media.MediaException;
import javax.microedition.media.protocol.DataSource;
import javax.microedition.media.protocol.SourceStream;

public final class DirectMIDI extends DirectPlayer {
    private DirectMIDIControl midiCtrl;
    DirectVolume dVolumeControl;
    DirectMetaData dMetaDataControl;
    private DirectMIDIControl midiControl;
    private Control tunerControl;
    private Control rdsControl;
    static int buffersize = 0;
    private DirectRecord recordControl = null;
    private DirectVideo videoControl = null;

    
    protected Control doGetControl(String str) {
        System.out.println(new StringBuffer().append("DirectMIDI:").append(str).toString());
        String str2 = str;
        if (str.startsWith("javax.microedition.media.control.")) {
            str2 = str.substring("javax.microedition.media.control.".length());
        }
        if (!str2.equals("FramePositioningControl")) {
            if (str2.equals("MetaDataControl")) {
                if (DirectPlayer.nIsMetaDataControlSupported(this.hNative)) {
                    if (this.dMetaDataControl == null) {
                        this.dMetaDataControl = new DirectMetaData(this.hNative);
                    }
                    return this.dMetaDataControl;
                }
            } else if (str2.equals("MIDIControl")) {
                if (DirectPlayer.nIsMIDIControlSupported(this.hNative)) {
                    if (this.midiControl == null) {
                        this.midiControl = new DirectMIDIControl(this);
                    }
                    return this.midiControl.getMIDIControl();
                }
            } else if (str2.equals("PitchControl")) {
                if (DirectPlayer.nIsPitchControlSupported(this.hNative)) {
                    if (this.midiControl == null) {
                        this.midiControl = new DirectMIDIControl(this);
                    }
                    return this.midiControl.getPitchControl();
                }
            } else if (str2.equals("RateControl")) {
                if (DirectPlayer.nIsRateControlSupported(this.hNative)) {
                    if (this.midiControl == null) {
                        this.midiControl = new DirectMIDIControl(this);
                    }
                    return this.midiControl.getRateControl();
                }
            } else if (str2.equals("RecordControl")) {
                if (DirectPlayer.nIsRecordControlSupported(this.hNative)) {
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
                if (DirectPlayer.nIsTempoControlSupported(this.hNative)) {
                    if (this.midiControl == null) {
                        this.midiControl = new DirectMIDIControl(this);
                    }
                    return this.midiControl.getTempoControl();
                }
            } else if (!str2.equals("VideoControl") && !str2.equals("ToneControl") && str2.equals("VolumeControl") && DirectPlayer.nIsVolumeControlSupported(this.hNative)) {
                if (this.dVolumeControl == null) {
                    this.dVolumeControl = new DirectVolume(this, this.hNative);
                }
                return this.dVolumeControl;
            }
        }
        if (null == this.videoControl) {
            return null;
        }
        if (str2.equals("VideoControl") || str2.equals("GUIControl")) {
            return this.videoControl;
        }
        return null;
    }

    private static byte[] steamToByte(DataSource dataSource) throws IOException {
        dataSource.connect();
        SourceStream[] streams = dataSource.getStreams();
        byte[] bArr = new byte[Constants.IMAGE_CACHE_THRESHOLD];
        System.out.println(new StringBuffer().append("sources.length:").append(streams.length).toString());
        for (int idx = 0; idx < streams.length; idx++) {
            SourceStream sourceStream = streams[idx];
            sourceStream.seek(0L);
            System.out.println(new StringBuffer().append("input.length:").append(sourceStream.getContentLength()).toString());
            System.out.println(new StringBuffer().append("input.getTransferSize:").append(sourceStream.getTransferSize()).toString());
            int i = 0;
            int i2 = 1;
            buffersize = 0;
            while (i2 > 0) {
                i2 = sourceStream.read(bArr, i, i + 16);
                i += 16;
            }
            buffersize += i;
        }
        return bArr;
    }

    // Use parent class nStart and nStop methods
    // protected native boolean nStart(int i);
    // protected native boolean nStop(int i);

    protected native void nSetLoopCount(int i, int i2);

    protected native long ndoSetMediaTime(int i, long j);

    protected native long ndoGetDuration(int i);

    protected native long ndoGetMediaTime(int i);

    protected static native int nBuffering(byte[] bArr, int i);

    
    public void setSource(DataSource dataSource) throws MediaException {
        this.source = dataSource;
    }

    
    protected void doRealize() throws MediaException {
        try {
            System.out.println("doRealize");
            this.mediaDownload.bgDownload();
        } catch (Exception e) {
            System.out.println(e);
        }
    }

    
    protected void doPrefetch() throws MediaException {
        System.out.println("doPrefetch");
    }

    
    public void setLoopCount(int i) {
        chkClosed(false);
        if (this.state == 400) {
            throw new IllegalStateException("setLoopCount");
        }
        if (i == 0 || i < -1) {
            throw new IllegalArgumentException("setLoopCount");
        }
        nSetLoopCount(this.hNative, i);
        this.loopCountSet = i;
        this.loopCount = i;
    }

    
    protected boolean doStart() {
        nStart(this.hNative);
        System.out.println("doStart");
        return true;
    }

    
    protected void doStop() throws MediaException {
        nStop(this.hNative);
        System.out.println("doStop");
    }

    
    protected void doDeallocate() {
        System.out.println("doDeallocate");
    }

    
    protected void doClose() {
        nStop(this.hNative);
        System.out.println("doClose");
    }

    
    protected long doSetMediaTime(long j) throws MediaException {
        return ndoSetMediaTime(this.hNative, j);
    }

    
    protected long doGetMediaTime() {
        return ndoGetMediaTime(this.hNative);
    }

    
    protected long doGetDuration() {
        System.out.println("doGetDuration");
        long ndoGetDuration = ndoGetDuration(this.hNative);
        System.out.println(ndoGetDuration);
        return ndoGetDuration;
    }
}