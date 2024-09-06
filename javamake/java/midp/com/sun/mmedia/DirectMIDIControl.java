package com.sun.mmedia;

import javax.microedition.media.MediaException;
import javax.microedition.media.control.MIDIControl;
import javax.microedition.media.control.PitchControl;
import javax.microedition.media.control.RateControl;
import javax.microedition.media.control.TempoControl;

public class DirectMIDIControl implements DirectControls {
    private BasicPlayer _player;
    private MIDIControlImpl midiCtl = null;
    private RateControlImpl rateCtl = null;
    private PitchControlImpl pitchCtl = null;
    private TempoControlImpl tempoCtl = null;
    private int _cachedRate = -1;

    public class MIDIControlImpl implements MIDIControl {
        private final DirectMIDIControl this$0;

        MIDIControlImpl(DirectMIDIControl directMIDIControl) {
            this.this$0 = directMIDIControl;
        }

        
        public synchronized boolean isBankQuerySupported() {
            return this.this$0.nIsBankQuerySupported(this.this$0._player.hNative);
        }

        
        public synchronized int[] getProgram(int i) throws MediaException {
            this.this$0.checkState();
            this.this$0.checkChannel(i);
            int[] iArr = new int[2];
            if (this.this$0.nGetProgram(this.this$0._player.hNative, i, iArr) < 0) {
                throw new MediaException("GetProgram failure");
            }
            return iArr;
        }

        
        public synchronized int[] getBankList(boolean z) throws MediaException {
            this.this$0.checkState();
            int[] iArr = new int[20];
            int nGetBankList = this.this$0.nGetBankList(this.this$0._player.hNative, z, iArr);
            if (nGetBankList < 0) {
                throw new MediaException("BankList failure");
            }
            int[] iArr2 = new int[nGetBankList];
            for (int i = 0; i < nGetBankList; i++) {
                iArr2[i] = iArr[i];
            }
            return iArr2;
        }

        
        public synchronized String getKeyName(int i, int i2, int i3) throws MediaException {
            this.this$0.checkState();
            this.this$0.checkBank(i);
            this.this$0.checkProgram(i2);
            if (i3 < 0 || i3 > 127) {
                throw new IllegalArgumentException("key out of range");
            }
            byte[] bArr = new byte[64];
            int nGetKeyName = this.this$0.nGetKeyName(this.this$0._player.hNative, i, i2, i3, bArr);
            if (nGetKeyName < 0) {
                throw new MediaException("KeyName failure");
            }
            return new String(bArr, 0, nGetKeyName);
        }

        
        public synchronized String getProgramName(int i, int i2) throws MediaException {
            this.this$0.checkState();
            this.this$0.checkBank(i);
            this.this$0.checkProgram(i2);
            byte[] bArr = new byte[64];
            int nGetProgramName = this.this$0.nGetProgramName(this.this$0._player.hNative, i, i2, bArr);
            if (nGetProgramName < 0) {
                throw new MediaException("ProgramName failure");
            }
            return new String(bArr, 0, nGetProgramName);
        }

        
        public synchronized int[] getProgramList(int i) throws MediaException {
            this.this$0.checkState();
            this.this$0.checkBank(i);
            int[] iArr = new int[200];
            int nGetProgramList = this.this$0.nGetProgramList(this.this$0._player.hNative, i, iArr);
            if (nGetProgramList < 0) {
                throw new MediaException("ProgramList failure");
            }
            int[] iArr2 = new int[nGetProgramList];
            for (int i2 = 0; i2 < nGetProgramList; i2++) {
                iArr2[i2] = iArr[i2];
            }
            return iArr2;
        }

        
        public synchronized void setChannelVolume(int i, int i2) {
            this.this$0.checkState();
            this.this$0.checkChannel(i);
            this.this$0.checkVolume(i2);
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return;
            }
            this.this$0.nSetChannelVolume(this.this$0._player.hNative, i, i2);
        }

        
        public synchronized int getChannelVolume(int i) {
            this.this$0.checkState();
            this.this$0.checkChannel(i);
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return -1;
            }
            return this.this$0.nGetChannelVolume(this.this$0._player.hNative, i);
        }

        
        public synchronized void setProgram(int i, int i2, int i3) {
            this.this$0.checkState();
            this.this$0.checkChannel(i);
            if (i2 != -1) {
                this.this$0.checkBank(i2);
            }
            this.this$0.checkProgram(i3);
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return;
            }
            this.this$0.nSetProgram(this.this$0._player.hNative, i, i2, i3);
        }

        
        public synchronized void shortMidiEvent(int i, int i2, int i3) {
            this.this$0.checkState();
            this.this$0.checkType(i);
            this.this$0.checkData(i2);
            this.this$0.checkData(i3);
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return;
            }
            this.this$0.nShortMidiEvent(this.this$0._player.hNative, i, i2, i3);
        }

        
        public synchronized int longMidiEvent(byte[] bArr, int i, int i2) {
            this.this$0.checkState();
            this.this$0.checkLongMidiEvent(bArr, i, i2);
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return -1;
            }
            return this.this$0.nLongMidiEvent(this.this$0._player.hNative, bArr, i, i2);
        }
    }

    public class PitchControlImpl implements PitchControl {
        private final DirectMIDIControl this$0;

        PitchControlImpl(DirectMIDIControl directMIDIControl) {
            this.this$0 = directMIDIControl;
        }

        
        public synchronized int setPitch(int i) {
            int maxPitch = getMaxPitch();
            int minPitch = getMinPitch();
            if (i > maxPitch) {
                i = maxPitch;
            } else if (i < minPitch) {
                i = minPitch;
            }
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0.nSetPitch(this.this$0._player.hNative, i);
        }

        
        public synchronized int getPitch() {
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0.nGetPitch(this.this$0._player.hNative);
        }

        
        public synchronized int getMaxPitch() {
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0.nGetMaxPitch(this.this$0._player.hNative);
        }

        
        public synchronized int getMinPitch() {
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0.nGetMinPitch(this.this$0._player.hNative);
        }
    }

    public class RateControlImpl implements RateControl {
        private final DirectMIDIControl this$0;

        RateControlImpl(DirectMIDIControl directMIDIControl) {
            this.this$0 = directMIDIControl;
        }

        
        public synchronized int setRate(int i) {
            if (this.this$0._player == null) {
                return 0;
            }
            int maxRate = getMaxRate();
            int minRate = getMinRate();
            if (i > maxRate) {
                i = maxRate;
            } else if (i < minRate) {
                i = minRate;
            }
            this.this$0.recalculateStopTime();
            if (this.this$0._player.state >= 400) {
                this.this$0._cachedRate = -1;
                return this.this$0.nSetRate(this.this$0._player.hNative, i);
            }
            this.this$0._cachedRate = i;
            return i;
        }

        
        public synchronized int getRate() {
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0._cachedRate == -1 ? this.this$0.nGetRate(this.this$0._player.hNative) : this.this$0._cachedRate;
        }

        
        public synchronized int getMaxRate() {
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0.nGetMaxRate(this.this$0._player.hNative);
        }

        
        public synchronized int getMinRate() {
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0.nGetMinRate(this.this$0._player.hNative);
        }
    }

    public class TempoControlImpl extends RateControlImpl implements TempoControl {
        private final DirectMIDIControl this$0;

        TempoControlImpl(DirectMIDIControl directMIDIControl) {
            super(directMIDIControl);
            this.this$0 = directMIDIControl;
        }

        
        public synchronized int setTempo(int i) {
            if (i < 0) {
                i = 0;
            }
            this.this$0.recalculateStopTime();
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0.nSetTempo(this.this$0._player.hNative, i);
        }

        
        public synchronized int getTempo() {
            if (this.this$0._player == null || this.this$0._player.hNative == 0) {
                return 0;
            }
            return this.this$0.nGetTempo(this.this$0._player.hNative);
        }
    }

    public native void nSetChannelVolume(int i, int i2, int i3);

    public native int nGetChannelVolume(int i, int i2);

    public native void nSetProgram(int i, int i2, int i3, int i4);

    public native void nShortMidiEvent(int i, int i2, int i3, int i4);

    public native int nLongMidiEvent(int i, byte[] bArr, int i2, int i3);

    public native int nGetMaxRate(int i);

    public native int nGetMinRate(int i);

    public native int nSetRate(int i, int i2);

    public native int nGetRate(int i);

    public native int nGetMaxPitch(int i);

    public native int nGetMinPitch(int i);

    public native int nSetPitch(int i, int i2);

    public native int nGetPitch(int i);

    public native int nGetTempo(int i);

    public native int nSetTempo(int i, int i2);

    public native boolean nIsBankQuerySupported(int i);

    public native int nGetBankList(int i, boolean z, int[] iArr);

    public native int nGetKeyName(int i, int i2, int i3, int i4, byte[] bArr);

    public native int nGetProgramName(int i, int i2, int i3, byte[] bArr);

    public native int nGetProgramList(int i, int i2, int[] iArr);

    public native int nGetProgram(int i, int i2, int[] iArr);

    public DirectMIDIControl(BasicPlayer basicPlayer) {
        this._player = basicPlayer;
    }

    public void checkState() {
        if (this._player.state < 300) {
            throw new IllegalStateException("Not prefetched");
        }
    }

    public void checkChannel(int i) {
        if (i < 0 || i > 15) {
            throw new IllegalArgumentException("Channel is out of range");
        }
    }

    public void checkVolume(int i) {
        if (i < 0 || i > 127) {
            throw new IllegalArgumentException("Volume is out of range");
        }
    }

    public void checkType(int i) {
        if (i < 128 || i > 255 || i == 240 || i == 247) {
            throw new IllegalArgumentException("Type is out of range");
        }
    }

    public void checkData(int i) {
        if (i < 0 || i > 127) {
            throw new IllegalArgumentException("Data is out of range");
        }
    }

    public void checkLongMidiEvent(byte[] bArr, int i, int i2) {
        if (bArr == null) {
            throw new IllegalArgumentException("Data is null for long MIDI event ");
        }
        if (i >= bArr.length || i < 0) {
            if (bArr.length != 0) {
                throw new IllegalArgumentException("Invalid offset for long MIDI event");
            }
        } else if (i2 > bArr.length || i2 < 0) {
            throw new IllegalArgumentException("Length is out of range for long MIDI event");
        }
    }

    public void checkProgram(int i) {
        if (i < 0 || i > 127) {
            throw new IllegalArgumentException("Program is out of range");
        }
    }

    public void checkBank(int i) {
        if (i < 0 || i > 16383) {
            throw new IllegalArgumentException("Bank is out of range");
        }
    }

    
    public synchronized void playerStarted() {
        if (this._cachedRate != -1) {
            nSetRate(this._player.hNative, this._cachedRate);
            this._cachedRate = -1;
        }
    }

    
    public synchronized void playerStopped() {
    }

    
    public synchronized void playerClosed() {
        this._player = null;
    }

    public synchronized MIDIControl getMIDIControl() {
        if (null == this.midiCtl) {
            this.midiCtl = new MIDIControlImpl(this);
        }
        return this.midiCtl;
    }

    public synchronized RateControl getRateControl() {
        if (null == this.rateCtl) {
            this.rateCtl = new RateControlImpl(this);
        }
        return this.rateCtl;
    }

    public synchronized PitchControl getPitchControl() {
        if (null == this.pitchCtl) {
            this.pitchCtl = new PitchControlImpl(this);
        }
        return this.pitchCtl;
    }

    public synchronized TempoControl getTempoControl() {
        if (null == this.tempoCtl) {
            this.tempoCtl = new TempoControlImpl(this);
        }
        return this.tempoCtl;
    }

    public void recalculateStopTime() {
        if (this._player != null) {
            long stopTime = this._player.getStopTime();
            if (stopTime != Long.MAX_VALUE) {
                this._player.setStopTime(Long.MAX_VALUE);
                this._player.setStopTime(stopTime);
            }
        }
    }
}