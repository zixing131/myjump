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

/*
 * - Conditional Compile Flags -
 * 
 * ENABLE_MULTIPLE_ISOLATES : MVM mode ?
 * RECORD : Support Recording ?
 */

package com.sun.mmedia;

import java.io.IOException;
import java.util.*;
import com.sun.j2me.log.Logging;
import com.sun.j2me.log.LogChannels;

import com.sun.mmedia.DefaultConfiguration;
import com.sun.mmedia.DirectVolume;
import com.sun.mmedia.DirectMetaData;
import javax.microedition.media.Player;
import javax.microedition.media.PlayerListener;
import javax.microedition.media.MediaException;
import javax.microedition.media.Control;
import com.sun.mmedia.Configuration;
import com.sun.mmedia.protocol.BasicDS;

import javax.microedition.media.control.StopTimeControl;

import com.sun.mmedia.DirectRecord;


/**
 * Media direct player base class
 * This class depends on native library to handle media data
 */ 
public class DirectPlayer extends BasicPlayer implements VideoSource 

    , MediaEventConsumer

{
    // Temp buffer shared by all of Player from the same isolate
    private static byte[] buffer;    
    
    // Package variables
    DirectVolume dVolumeControl;
    DirectMetaData dMetaDataControl;

    private long remained;      // remained content length

    private Timer stopTimer;    // To support StopTimeControl
    private static final long STOP_TIME_ADVANCE = 100; // ms
    
    private DirectRecord recordControl = null;
    
    private DirectMIDIControl midiControl;
    private Control tunerControl;
    private Control rdsControl;

    
    // Tunnel between media and MIDP
    private static MediaTunnel mediaTunnel;
    private int mvmOption = -1;
    
    
    private boolean isStreaming = false;
    private boolean isFirstStart = true;

    protected boolean wholeDataDownloaded = false;

    // this field will be checked in the native finalizer
    private boolean hasTakenRadioAccess = false;

    private DirectVideo videoControl = null;
    
    private Object snapshotLock = new Object();

// Native functions /////////////////////////////////////////////////
    
    // Terminate native library
    protected native int nTerm(int handle);
    // Get Content Type
    protected native String nGetContentType(int handle);
    // Access to Radio Tuner for a Java Player is exclusive. 
    // Acquire it or return false if it is not available
    private native boolean nAcquireRadioAccess();
    // Device is available?
    protected native boolean nAcquireDevice(int handle);
    // Relase device reference
    protected native void nReleaseDevice(int handle);
    // Access to Radio Tuner for a Java Player is exclusive. Release it
    private native void nReleaseRadioAccess();
    // Clear buffered data
    protected native boolean nFlushBuffer(int handle);
    // Start playing
    protected native boolean nStart(int handle);
    // Stop playing
    protected native boolean nStop(int handle);
    // Get current media time as ms
    protected native int nGetMediaTime(int handle);
    // Set media time as ms
    protected native int nSetMediaTime(int handle, long ms);
    // Get total duration of media data
    protected native int nGetDuration(int handle);
    // Pause
    protected native boolean nPause(int handle);
    // Resume
    protected native boolean nResume(int handle);
    // Need buffering from Java side?
    protected native boolean nIsNeedBuffering(int handle);
    // Switch to foreground
    private native boolean nSwitchToForeground(int hNative, int options);
    // Switch to background
    private native boolean nSwitchToBackground(int hNative, int options);

    


    private native void finalize();
    

    // Ask for PcmAudio support
    private native boolean nPcmAudioPlayback(int hNative);

    // Start Prefetch of Native Player
    protected native boolean nPrefetch(int hNative);
    // Is Control supported by native or not
    protected static native boolean nIsFramePositioningControlSupported(int hNative);
    protected static native boolean nIsMetaDataControlSupported(int hNative);
    protected static native boolean nIsMIDIControlSupported(int hNative);
    protected static native boolean nIsPitchControlSupported(int hNative);
    protected static native boolean nIsRateControlSupported(int hNative);
    protected static native boolean nIsRecordControlSupported(int hNative);
    protected static native boolean nIsStopTimeControlSupported(int hNative);
    protected static native boolean nIsTempoControlSupported(int hNative);
    protected static native boolean nIsVideoControlSupported(int hNative);
    protected static native boolean nIsToneControlSupported(int hNative);
    protected static native boolean nIsVolumeControlSupported(int hNative);

    // -----------------------------
    // Video related native methods
    // -----------------------------

    // Get video width
    protected native int nGetWidth(int handle);

    // Get video height
    protected native int nGetHeight(int handle);

    // Set display location of video
    protected native boolean nSetLocation(int handle, int x, int y, int w, int h);

    // Get snapshot
    protected native void nStartSnapshot( int handle, String imageType );
    protected native byte[] nGetSnapshotData( int handle );
    
    // Set fullscreen
    protected native boolean nSetFullScreenMode(int handle, boolean fullscreen);

    // Set visible
    protected native boolean nSetVisible(int handle, boolean visible);

    // Turn on or off color key
    private native boolean nSetColorKey(int handle, boolean on, int colorKey);
    
    // Member functions /////////////////////////////////////////////////

    /**
     * Constructor
     */
    public DirectPlayer()
    {
        super();

        
        // Get media tunnerl singleton instance
        mediaTunnel = MediaTunnel.getInstance();
        
    }
    
    public int getNativeHandle()
    {
        return hNative;
    }

    /**
     * StopTimeControl implementation of DirectPlayer
     *
     * @param time the time in microseconds at which the <code>Player</code>
     * should stop.
     */
    protected void doSetStopTime(long time) {
        if (time == StopTimeControl.RESET && stopTimer != null) {
            stopTimer.cancel();
            stopTimer = null;

        } else if (time != StopTimeControl.RESET && state == STARTED) {
            long currentTime = doGetMediaTime();
            if (time >= currentTime) {
                scheduleStopTimer(time);
            }
        }
    }
    
    private boolean scheduleStopTimer(long time) {
        long tempo = 100000, rate = 100000;
        boolean isRateControlSupported = false;
        boolean isTempoControlSupported = false;
        boolean stopped = false;
        long duration = doGetDuration();
        long currentTime = doGetMediaTime();
        
        if (currentTime == TIME_UNKNOWN) {
            return false;
        }
        
        if (hNative != 0) {
            isRateControlSupported = nIsRateControlSupported(hNative);
            isTempoControlSupported = nIsTempoControlSupported(hNative);
        }
        if (midiControl == null &&
                (isRateControlSupported || isTempoControlSupported)) {
            midiControl = new DirectMIDIControl(this);
        }
        if (midiControl != null) {
            if (isRateControlSupported) {
                rate = midiControl.getRateControl().getRate();
            }
            if (isTempoControlSupported) {
                tempo = midiControl.getTempoControl().getTempo();
            }
        }
        
        if (stopTimer != null) {
            stopTimer.cancel();
            stopTimer = null;
        }
        long scheduleTime = (time - currentTime - STOP_TIME_ADVANCE) / 1000 * 100000 * 100000 / (rate * tempo);
        if (scheduleTime <= 0) {
            synchronized (this) {
                try {
                    doPreStop();
                    doStop();
                } catch (MediaException e) {
                    Logging.report(Logging.ERROR, LogChannels.LC_MMAPI,
                        "Exception during stop by stop timer");
                }
            }
            satev();
            
            stopped = true;
        } else {
            stopTimer = new Timer();
            stopTimer.schedule(new StopTimeController(), scheduleTime);
        }
        return stopped;
    }

    /**
     * Read header information from media data and determine media Format
     *
     * @exception  MediaException  Description of the Exception
     */
    protected void doRealize() throws MediaException {

        
        // Add to media tunnel as event consumer
        // and, let native layer knows about their situation
        synchronized(mediaTunnel) {
            if (mvmOption == -1) {
                mvmOption = mediaTunnel.isBackPlayable() ? mediaTunnel.PLAYABLE_FROM_BACKGROUND : 0;
            }
            if (true == mediaTunnel.registerMediaEventConsumer(this)) {
                nSwitchToForeground(hNative, mvmOption);
            } else {
                nSwitchToBackground(hNative, mvmOption);
            }
        }
        

        // Is straming source?
        isStreaming = isStreamingSource();
        
        if( isVideoPlayer() )
        {
            videoControl = new DirectVideo( this, nGetWidth( hNative ), 
                                         nGetHeight( hNative ) );
        }
    }
    
    private boolean isRadioPlayer()
    {
        return ( null != source.getLocator() && 
            source.getLocator().startsWith( 
                DefaultConfiguration.RADIO_CAPTURE_LOCATOR ) );
    }
    
    private void prefetchData() throws MediaException
    {
        /* prefetch native player */
        if (!nPrefetch(hNative)) {
            throw new MediaException("Can not prefetch");
        }

        if (!handledByDevice) {
            /* predownload media data to fill native buffers */
            if (mediaDownload != null) {
                try {
                    mediaDownload.fgDownload();
                } catch (IOException ex) {
                    throw new MediaException("Can not start media download thread : " + ex);
                }
            }
        }
    }
    
    private void acquireDevice() throws MediaException
    {
        if( isRadioPlayer() )
        {
            if( !nAcquireRadioAccess() )
            {
                throw new MediaException( "Radio Tuner is already used " +
                        "by a Java Player" );
            }
            hasTakenRadioAccess = true;
        }

        if(!nAcquireDevice(hNative)) {
            releaseRadioAccess();
            throw new MediaException("Can not acquire device");
        }
    }
    
    /**
     * 1. Get all data from stream and buffering it to native library
     *
     * @exception  MediaException  Description of the Exception
     */
    protected void doPrefetch() throws MediaException {

        prefetchData();
        acquireDevice();
        
        if (nPcmAudioPlayback(hNative)) {
            AudioTunnel.getInstance().start();
        }
    }

    /**
     * Overrides from BasicPlayer
     */

    
    protected void doReceiveRSL()
    {
        if (Logging.REPORT_LEVEL <= Logging.INFORMATION) {
            Logging.report(Logging.INFORMATION, LogChannels.LC_MMAPI,
            "[direct] received RSL");
        }
        
        if (recordControl != null) {
            recordControl.recordSizeLimitReached();
        }
    }
    
    
    protected void doPostStart() {
        if (dVolumeControl != null) {
            dVolumeControl.setToThisPlayerLevel();     /* set to this player's volume level */
            dVolumeControl.setToPlayerMute();          /* set to this player's mute state */
        }

        if (stopTime != StopTimeControl.RESET) {
            if (scheduleStopTimer(stopTime)) { // Media stop-time has already passed
                return;
            }
        }

        
        if (recordControl != null) {
            recordControl.playerStarted();
        }
        
        
        if (midiControl != null) {
            midiControl.playerStarted();
        }
        
        if (mediaDownload != null) {
            try {
                mediaDownload.bgDownload();
            } catch(Exception ex) {
                try {
                    stop();
                } catch(MediaException mEx) {
                }
            }
        }
    }
    
    /**
     * Override method in BasicPlayer to do the actual starting of the
     * <code>Player</code>
     *
     * @return <code>true</code> if player start was successful,
     *         <code>false</code> otherwise.
     */
    protected boolean doStart() {
        boolean ret = false;
        
        if( null != videoControl )
        {
            videoControl.start();
        }
        
        if (isFirstStart || (0 == getMediaTime())) {
            ret = nStart(hNative);
            isFirstStart = false;
        } else {
            ret = nResume(hNative);    
        }
        
        return ret;
    }

    protected void continueDownload() {
        /* predownload media data to fill native buffers */
        if (mediaDownload != null) {
            mediaDownload.continueDownload();
        }
    }
    
    /**
     * Override method in BasicPlayer to get the media time
     * of the <code>Player</code>
     *
     * @return The <code>Player</code>'s current media time.
     */
    protected long doGetMediaTime() {
        int ret = nGetMediaTime(hNative);
        if (ret != Player.TIME_UNKNOWN) {
            return (ret * 1000);
        }
        return ret;
    }
    
    /**
     * Overrides from BasicPlayer (pre works for stop)
     */
    protected void doPreStop() {
        if (stopTimer != null) {
            stopTimer.cancel();
            stopTimer = null;
        }
        
        if (recordControl != null) {
            recordControl.playerStopped();
        }
        
        if (midiControl != null) {
            midiControl.playerStopped();
        }
    }
    
    /**
     * Subclasses need to implement this to realize
     * the <code>Player</code>.
     *
     * @exception  MediaException  Description of the Exception
     */
    protected void doStop() throws MediaException {

        if ( null != videoControl )
        {
            videoControl.stop();
        }
        
        if (false == nPause(hNative)) {
            throw new MediaException("Player cannot be stopped");
        }
    }

    private void releaseRadioAccess()
    {
        if( isRadioPlayer() )
        {
            nReleaseRadioAccess();
            hasTakenRadioAccess = false;
        }
    }
    
    /**
     * Override method in BasicPlayer to deallocate
     * the <code>Player</code>.
     */
    protected void doDeallocate() {
        // release device
        if (nPcmAudioPlayback(hNative)) {
            AudioTunnel.getInstance().stop();
        }
        
        releaseRadioAccess();

        if (mediaDownload != null) {
            mediaDownload.deallocate();
        }

        nReleaseDevice(hNative);

        isFirstStart = true;
    }
    
    /**
     * Override method in BasicPlayer to close
     * the <code>Player</code>.
     */
    protected void doClose() {
        if( null != videoControl )
        {
            videoControl.close();
            videoControl = null;
        }
        
        
        // Unregister from media tunnel
        mediaTunnel.unregisterMediaEventConsumer(this);
        

        
        if (recordControl != null) {
            recordControl.playerClosed();
            recordControl = null;
        }
        
        if (midiControl != null) {
            midiControl.playerClosed();
            midiControl = null;
        }

        if (dMetaDataControl != null) {
            dMetaDataControl.playerClosed();
            dMetaDataControl = null;
        }

        if (dVolumeControl != null) {
            dVolumeControl.playerClosed();
            dVolumeControl = null;
        }

        if (hNative != 0) {
            if ( true == nIsNeedBuffering(hNative) ) {
                nFlushBuffer(hNative);
            }
            nTerm(hNative);
            hNative = 0;
        }
    }
    
    /**
     * Override method in BasicPlayer to set the media time
     * of the <code>Player</code>.
     *
     * @param now The new media time in microseconds.
     * @return The actual media time set in microseconds.
     * @exception MediaException Thrown if the media time cannot be set.
     */
    protected long doSetMediaTime(long now) throws MediaException {
        if (now <= 0) now = 0;
        
        long dur = doGetDuration();

        if (TIME_UNKNOWN != dur && now > dur) now = dur;
        
        int ret = nSetMediaTime(hNative, now/1000);
        if (ret == -1) {
            throw new MediaException("media time cannot be set");
        }                
        return (ret * 1000);
    }
    
    /**
     * Override method in BasicPlayer to get the duration
     * of the <code>Player</code>.
     *
     * @return the duration in microseconds or <code>TIME_UNKNOWN</code>
     */
    protected long doGetDuration() {
        if (isCapturePlayer()) {
            return Player.TIME_UNKNOWN;
        } else if (isDevicePlayer() && !hasToneSequenceSet) {
            return 0;
        } else {
            int ret = nGetDuration(hNative);
            if (ret != Player.TIME_UNKNOWN) {
                return (ret * 1000);    
            }
            return ret;
        }
    }
    
    /**
     * The worker method to actually obtain the control.
     *
     * @param  type  the class name of the <code>Control</code>.
     * @return       <code>Control</code> for the class or interface
     * name.
     */
    protected Control doGetControl(String type) {
        String prefix = "javax.microedition.media.control.";
        String shortType = type;

        if (type.startsWith(prefix)) {
            shortType = type.substring(prefix.length());
        }

        if (shortType.equals(fpcName)) {
//            if (nIsFramePositioningControlSupported(hNative)) {
//            }
        } else if (shortType.equals(mdcName)) {
            if (nIsMetaDataControlSupported(hNative)) {
                if (dMetaDataControl == null)
                    dMetaDataControl = new DirectMetaData(hNative);
                return dMetaDataControl;
            }
        } else if (shortType.equals(micName)) {
            if (nIsMIDIControlSupported(hNative)) {
                if (midiControl == null) 
                    midiControl = new DirectMIDIControl(this);
                return midiControl.getMIDIControl();
            }
        } else if (shortType.equals(picName)) {
            if (nIsPitchControlSupported(hNative)) {
                if (midiControl == null) 
                    midiControl = new DirectMIDIControl(this);
                return midiControl.getPitchControl();
            }
        } else if (shortType.equals(racName)) {
            if (nIsRateControlSupported(hNative)) {
                if (midiControl == null) 
                    midiControl = new DirectMIDIControl(this);
                return midiControl.getRateControl();
            }
        } else if (shortType.equals(recName)) {
            if (nIsRecordControlSupported(hNative)) {
                if (recordControl == null) {
                    recordControl = new DirectRecord(this);
                }
                return recordControl;
            }
        } else if (shortType.equals(stcName)) {
            if (!isCapturePlayer()) {
                return this;
            }
//            if (nIsStopTimeControlSupported(hNative)) {
//            }
        } else if (shortType.equals(tecName)) {
            if (nIsTempoControlSupported(hNative)) {
                if (midiControl == null) 
                    midiControl = new DirectMIDIControl(this);
                return midiControl.getTempoControl();
            }
        } else if (shortType.equals(vicName)) {
//            if (nIsVideoControlSupported(hNative)) {
//            }
        } else if (shortType.equals(tocName)) {
//            if (nIsToneControlSupported(hNative)) {
//            }
        } else if (shortType.equals(vocName)) {
            if (nIsVolumeControlSupported(hNative)) {
                if (dVolumeControl == null) {
                    dVolumeControl = new DirectVolume(this, hNative);
                }
                return dVolumeControl;
            }
        }

        if ( null != videoControl ) {
            if (shortType.equals(vicName)) {        // VideoControl
                return videoControl;
            } else if (shortType.equals(guiName)) {  // GUIControl
                return videoControl;
            }
        }

        if ( isRadioPlayer() )
        {
            if( type.equals( 
                    "javax.microedition.amms.control.tuner.RDSControl" ) )
            {
                if( null == rdsControl )
                { 
                    rdsControl = 
                            Jsr234Proxy.getInstance().getRDSControl( this );
                }
                return rdsControl;
            } else if (type.equals( 
                    "javax.microedition.amms.control.tuner.TunerControl" )) {
                if (null == tunerControl) {
                    tunerControl =
                            Jsr234Proxy.getInstance().getTunerControl( this );
                }
                return tunerControl;
            }
        }
        return null;
    }

    /**
     * Is streaming source?
     */
    private boolean isStreamingSource() {
        String theProtocol = null;
        if (source != null) {
            String locStr = source.getLocator();
            if (locStr != null) {
                locStr = locStr.toLowerCase();
                int idx = locStr.indexOf(':');
                if (idx != -1) {
                    theProtocol = locStr.substring(0, idx);
                }
            }
        }

        if (theProtocol != null && theProtocol.equals("rtsp")) {
            return true;  
        }

        return false;
    }

    /**
     * Make additional processing of the first block (header)
     * 
     * @param  Source buffer
     * @param  Length of the source buffer
     */
    private void processHeader(byte[] buffer, int length) {
        if (source != null) {
            // Additional check to differentiate sp-midi and midi
            String mimeType = getContentType();
            BasicDS ds = (BasicDS)source;
            if ((ds != null) && mimeType.equals(Configuration.MIME_AUDIO_MIDI)) {
                final int MAX_SP_MIDI_SEARCH = 512;
                int maxSearch = length - 5;
                if (maxSearch > MAX_SP_MIDI_SEARCH)
                    maxSearch = MAX_SP_MIDI_SEARCH;
                    
                for (int i = 0; i < maxSearch; i++) 
                    if ((buffer[i] == (byte)0xF0) &&  
                        (buffer[i + 2] == (byte)0x7F) &&
                        (buffer[i + 4] == (byte)0x0B) &&
                        (buffer[i + 5] == (byte)0x01)) {
                        ds.setContentType(Configuration.MIME_AUDIO_SP_MIDI);
                        return;
                    }
            }
        }
    }
    
    public String getContentType()
    {
        String ctype = super.getContentType();
        
        if( null == ctype ) {
            ctype = nGetContentType(hNative);
            if( null != ctype ) {
                int s_pos = ctype.indexOf(' ');
                if (-1 != s_pos) {
                    ctype = ctype.substring(0, s_pos);
                }
            }
            if (ctype == null && source != null) {
                ctype = DefaultConfiguration.getContentType(source.getLocator());
            }
        }
        
        return ctype;
    }
    
    private boolean isVideoPlayer()
    {
        return nIsVideoControlSupported(hNative);
    }
    
    public void setSnapshotQuality( int quality )
    {
    }

    /**
     * Check for the multimedia snapshot permission.
     *
     * @exception SecurityException if the permission is not
     *            allowed by this token
     */
    public void checkSnapshotPermission() {
        try {
            PermissionAccessor.checkPermissions( getLocator(), PermissionAccessor.PERMISSION_SNAPSHOT );
        } catch( InterruptedException e ) {
            throw new SecurityException( "Interrupted while trying to ask the user permission" );
        }
    }

    // -------------------------------------------------
    // The interface VideoSource method implementations
    // -------------------------------------------------

    // Set display location of video
    public boolean setVideoLocation(int x, int y, int w, int h)
    {
        return nSetLocation( hNative, x, y, w, h );
    }

    private boolean isWaitingForSnapshot;
    // Get snapshot
    public synchronized byte[] getVideoSnapshot(String imageType) throws MediaException
    {
        byte [] ret = null;
        checkSnapshotPermission();
        try {
            synchronized ( snapshotLock )
            {
                nStartSnapshot( hNative, imageType );
                isWaitingForSnapshot = true;
                snapshotLock.wait( 10000 );
                if( isWaitingForSnapshot )
                {
                    isWaitingForSnapshot = false;
                    throw new MediaException( 
                            "Timed out while making a Camera Snapshot" );
                }
                
                ret = nGetSnapshotData( hNative );
            }
        }
        catch ( InterruptedException ie )
        {
            throw new MediaException( 
               "Camera Snapshot was interrupted by user: " + ie.toString() );
        }
        return ret;
    }

    void notifySnapshotFinished()
    {
        synchronized( snapshotLock )
        {
            if( isWaitingForSnapshot )
            {
                snapshotLock.notify();
                isWaitingForSnapshot = false;
            }
        }
    }
    
    // Set fullscreen
    public boolean setVideoFullScreen( boolean fullscreen)
    {
        return nSetFullScreenMode( hNative, fullscreen );
    }
    
    // Set visible
    public boolean setVideoVisible( boolean visible)
    {
        return nSetVisible( hNative, visible );
    }
    
    private boolean colorKeyOn = false;
    // Turn on or off color key
    public boolean setColorKey(boolean on, int colorKey)
    {
        if (colorKeyOn != on) {
            colorKeyOn = on;
            return nSetColorKey( hNative, on, colorKey );
        }
        return true;
    }

    // Notifies that the Display Size was changed
    public void notifyDisplaySizeChange()
    {
        sendEvent(PlayerListener.SIZE_CHANGED, videoControl);
    }
    
    /**
     * Inner class that support StopTimeControl
     */
    class StopTimeController extends TimerTask {
        public void run() {
            synchronized(DirectPlayer.this) {
/*
                try {
                    doSetMediaTime(stopTime);   // IMPL NOTE - Force set to stop time
                } catch(MediaException e) {
                    Logging.report(Logging.ERROR, LogChannels.LC_MMAPI,
                        "Exception during set time by stop timer");
                }
*/
                /* IMPL_NOTE: Timer used to execute this code uses system time,
                              which is not exactly in sync with media time, both
                              may change in relatively large increments. That's 
                              why we must wait here for media time to actually pass
                              stop-time point.
                */

                long mt  = doGetMediaTime();
                long dur = doGetDuration();
                
                while ((mt != -1) && 
                        (mt < stopTime) && (dur <= 0 || mt < dur)) {
                    try	{
                        java.lang.Thread.sleep( 10 );
                    } catch( InterruptedException e ) {
                        // just skip it
                    }
                    
                    mt = doGetMediaTime();
                }

                try {
                    doPreStop();
                    doStop();
                } catch (MediaException e) {
                    Logging.report(Logging.ERROR, LogChannels.LC_MMAPI,
                        "Exception during stop by stop timer");
                }
            }

            satev();
        }
    }
    
    

    // MVM Resource Handling Porting Layer
    ////////////////////////////////////////////////////////////////////

    /**
     * Called by event delivery when MIDlet controller (in AMS Isolate)
     * notifies MIDlet and its display that there is a change in its foreground status
     */    
    public void handleMediaForegroundNotify() {
        if (mvmOption == -1)
            mvmOption = mediaTunnel.isBackPlayable() ? mediaTunnel.PLAYABLE_FROM_BACKGROUND : 0;

        if (hNative != 0)
            nSwitchToForeground(hNative, mvmOption);
    }

    /**
     * Called by event delivery when MIDlet controller (in AMS Isolate)
     * notifies MIDlet and its display that there is a change in its foreground status
     */        
    public void handleMediaBackgroundNotify() {
        if (mvmOption == -1)
            mvmOption = mediaTunnel.isBackPlayable() ? mediaTunnel.PLAYABLE_FROM_BACKGROUND : 0;

        if (hNative != 0)
            nSwitchToBackground(hNative, mvmOption);
    }

    
}


