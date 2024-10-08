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

import javax.microedition.media.Manager;
import com.sun.j2me.log.Logging;
import com.sun.j2me.log.LogChannels;
import java.util.Vector;

/**
 *  The default configuration module for an MMAPI.
 *  implementation supporting the http, https and
 *  device protocols as well as the following
 *  content types:
 *
 *      Tones,
 *      Tone Sequences,
 *      AMR Narrowband
 *      AMR Wideband.
 *      GIF.
 *
 *  Please note:
 *
 *  Tone Sequences are supported over http and https in tone sequence
 *  file format (.jts).
 *
 *  Both single tones and tone sequence are also supported
 *  over the device protocol.
 *
 */
public class DefaultConfiguration extends Configuration {

    /**
     *  Handle for the Image Access Environment...
     */
    private static ImageAccess imageAccessor;

    private final static String[] JAVA_PROTOCOLS = new String[] {    
                                                                 


                                                                 


                                                                 "http",
                                                                 "https"
                                                               };

    private static boolean isJavaProtocol(String protocol) {
        for (int i = 0; i < JAVA_PROTOCOLS.length; i++) {
            if (protocol.toUpperCase().equals(JAVA_PROTOCOLS[i].toUpperCase())) {
                return true;
            }
        }
        return false;
    }

    private final static String[] JAVA_CONTENT_TYPES = new String[] {
        MIME_IMAGE_GIF
    };

    private static boolean isJavaContent(String mime) {
        for (int i = 0; i < JAVA_CONTENT_TYPES.length; i++) {
            if (mime.toUpperCase().equals(JAVA_CONTENT_TYPES[i].toUpperCase())) {
                return true;
            }
        }
        return false;
    }

    private final static String[] RTP_PROTOCOLS = new String[] { "rtp", "rtsp" };

    private static boolean isRtpProtocol(String protocol) {
        for (int i = 0; i < RTP_PROTOCOLS.length; i++) {
            if (protocol.toUpperCase().equals(RTP_PROTOCOLS[i].toUpperCase())) {
                return true;
            }
        }
        return false;
    }

    private final static String[] RTP_CONTENT_TYPES = new String[] {
      "audio/DVI4",      "audio/G722",    "audio/G723",    "audio/G726-16",
      "audio/G726-24",   "audio/G726-32", "audio/G726-40", "audio/G728",
      "audio/G729",      "audio/G729D",   "audio/G729E",   "audio/GSM",
      "audio/GSM-EFR",   "audio/L8",      "audio/L16",     "audio/LPC",
      "audio/MPA",       "audio/PCMA",    "audio/PCMU",    "audio/QCELP",
      "audio/RED",       "audio/VDVI",    "video/BT656",   "video/CelB",
      "video/JPEG",      "video/H261",    "video/H263",    "video/H263-1998",
      "video/H263-2000", "video/MPV",     "video/MP2T",    "video/MP1S",
      "video/MP2P",      "video/BMPEG",   "video/nv"
    };

    private static boolean isRtpContent(String mime) {
        String uMime = mime.toUpperCase();
        for (int i = 0; i < RTP_CONTENT_TYPES.length; i++) {
            String uRtpType = RTP_CONTENT_TYPES[i].toUpperCase();
            if (uMime.equals(uRtpType) || uMime.startsWith(uRtpType+";")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Allows RTP-specific content types to by tranferred only via RTP/RTSP,
     * while all other content types only via protocols other than RTP/RTSP
     */
    private static boolean allowed(String ctype, String protocol) {
        return isRtpContent(ctype) == isRtpProtocol(protocol);
    }

    /**
     * Constructor for the DefaultConfiguration object
     */
    public DefaultConfiguration() {
        super();

        // Protocol handlers.
        protocolHandlers.put("http", "com.sun.mmedia.protocol.CommonDS");
        protocolHandlers.put("https", "com.sun.mmedia.protocol.CommonDS");

        



        



        protocolHandlers.put("rtsp", "com.sun.mmedia.protocol.CommonDS");
        protocolHandlers.put("rtp", "com.sun.mmedia.protocol.CommonDS");
        

        protocolHandlers.put("device", "com.sun.mmedia.protocol.CommonDS");
        protocolHandlers.put("capture", "com.sun.mmedia.protocol.CommonDS");

        // Mime types
        mFormats.put("gif", "GIF");

        // Mime types
        mimeTypes.put("jts", MIME_AUDIO_TONE);
        mimeTypes.put("mid", MIME_AUDIO_MIDI);
        mimeTypes.put("midi", MIME_AUDIO_MIDI);
        mimeTypes.put("rmi", MIME_AUDIO_MIDI);
        mimeTypes.put("kar", MIME_AUDIO_MIDI);
        mimeTypes.put("wav", MIME_AUDIO_WAV);
        mimeTypes.put("mp3", MIME_AUDIO_MP3);
        mimeTypes.put("m4a", MIME_AUDIO_MP4);
        mimeTypes.put("qcp", MIME_AUDIO_QCELP);
        mimeTypes.put("aac", MIME_AUDIO_AAC);
        mimeTypes.put("amr", MIME_AUDIO_AMR);
        mimeTypes.put("awb", MIME_AUDIO_AMR_WB);
        mimeTypes.put("3gp", MIME_VIDEO_3GPP);
        mimeTypes.put("mpg", MIME_VIDEO_MPEG);
        mimeTypes.put("mp4", MIME_VIDEO_MPEG4);
        mimeTypes.put("wmv", MIME_VIDEO_WMV);
        mimeTypes.put("avi", MIME_VIDEO_AVI);
        mimeTypes.put("gif", MIME_IMAGE_GIF);

        // for converting
        mimeTypes.put("audio/tone", MIME_AUDIO_TONE);

        imageAccessor = new MIDPImageAccessor();
    }

    protected native int    nListContentTypesOpen(String protocol);
    protected native String nListContentTypesNext(int hdlr);
    protected native void   nListContentTypesClose(int hdlr);

    protected native int    nListProtocolsOpen(String mime);
    protected native String nListProtocolsNext(int hdlr);
    protected native void   nListProtocolsClose(int hdlr);

    /**
     *  Gets the supportedContentTypes attribute of the DefaultConfiguration object
     *
     * @param  protocol  Description of the Parameter
     * @return           The supportedContentTypes value
     */
    public String[] getSupportedContentTypes(String protocol) {

        Vector ctypes = new Vector();

        if (null == protocol || isJavaProtocol(protocol)) {
            // add content types supported by Java
            for (int c = 0; c < JAVA_CONTENT_TYPES.length; c++) {
                if (null == protocol || allowed(JAVA_CONTENT_TYPES[c],protocol)) {
                    ctypes.addElement(JAVA_CONTENT_TYPES[c]);
                }
            }
        }

        if (null == protocol) {
            // add content types supported by javacall
            int hList = nListContentTypesOpen(null);
            if (hList != 0) {
                String ctype;
                while (null != (ctype = nListContentTypesNext(hList))) {
                    addIfNotExists(ctypes, ctype);
                }
                nListContentTypesClose(hList);
            }
        } else {
            // add content types directly supported by javacall for this protocol
            int hList = nListContentTypesOpen(protocol);
            if (hList != 0) {
                String ctype;
                while ((ctype = nListContentTypesNext(hList)) != null) {
                    addIfNotExists(ctypes, ctype);
                }
                nListContentTypesClose(hList);
            }

            if (isJavaProtocol(protocol)) {
                // add content types supported by javacall via memory streaming.
                hList = nListContentTypesOpen("memory");
                if (hList != 0) {
                    String ctype;
                    while ((ctype = nListContentTypesNext(hList)) != null) {
                        if (allowed(ctype,protocol)) {
                            addIfNotExists(ctypes, ctype);
                        }
                    }
                    nListContentTypesClose(hList);
                }
            }
        }

        String ret[] = new String[ctypes.size()];
        ctypes.copyInto(ret);
        return ret;
    }

    /**
     *  Gets the supportedProtocols attribute of the DefaultConfiguration object
     *
     * @param  ctype  Description of the Parameter
     * @return        The supportedProtocols value
     */
    public String[] getSupportedProtocols(String ctype) {

        Vector protocols = new Vector();

        if (null == ctype || isJavaContent(ctype)) {
            // add protocols supported by java
            for (int p = 0; p < JAVA_PROTOCOLS.length; p++) {
                if (null == ctype || allowed(ctype, JAVA_PROTOCOLS[p])) {
                    protocols.addElement(JAVA_PROTOCOLS[p]);
                }
            }
        }

        // add protocols supported by javacall
        int hList = nListProtocolsOpen(ctype);
        if (0 != hList) {
            String protocol;

            while (null != (protocol = nListProtocolsNext(hList))) {
                if ("memory".equals(protocol)) {
                    // if javacall supports this ctype via memory streaming,
                    // add all protocols supported by java
                    for (int p = 0; p < JAVA_PROTOCOLS.length; p++) {
                        if (null==ctype || allowed(ctype, JAVA_PROTOCOLS[p])) {
                            addIfNotExists(protocols, JAVA_PROTOCOLS[p]);
                        }
                    }
                } else {
                    addIfNotExists(protocols, protocol);
                }
            }
            nListProtocolsClose(hList);
        }

        String[] ret = new String[protocols.size()];
        protocols.copyInto(ret);
        return ret;
    }

    public boolean isRadioSupported()
    {
        return nIsRadioSupported();
    }
    
    private native boolean nIsRadioSupported();

    /**
     * Hepler function adds string s to vector v if it's not already there
     */
    private static void addIfNotExists(Vector v, String s) {
        if (-1 == v.indexOf( s )) {
            v.addElement(s);
        }
    }

    /**
     * Get content type helper function
     */
    public static String getContentType(String locator) {
        if (locator != null) {
            if (locator.equals(Manager.TONE_DEVICE_LOCATOR)) {
                return DefaultConfiguration.MIME_AUDIO_TONE;
            } else if (locator.equals(Manager.MIDI_DEVICE_LOCATOR)) {
                return DefaultConfiguration.MIME_AUDIO_MIDI;
            } else if (locator.equals(Configuration.AUDIO_CAPTURE_LOCATOR)) {
                return DefaultConfiguration.MIME_AUDIO_WAV;
            } else if (locator.equals(Configuration.VIDEO_CAPTURE_LOCATOR)) {
                return DefaultConfiguration.MIME_IMAGE_PNG;
            }
        }

        return "";
    }

    public ImageAccess getImageAccessor() {
        return imageAccessor;
    }

    /**
     * Gets the video renderer.
     *
     * @return The video renderer
     */
    public VideoRenderer getVideoRenderer(BasicPlayer player) {
        // workaround for demo only
        return ModelVideoRenderer.getVideoRenderer(player);
        //return new MIDPVideoRenderer(player);
    }

    /**
     *  Gets the tonePlayer attribute of the DefaultConfiguration object
     *
     * @return    The tonePlayer value
     */
    public TonePlayer getTonePlayer() {
        return new NativeTonePlayer();
    }
    
    //public MIDIRenderer getMIDIRenderer() 
    //{
    //    return null;
    //}

    public String getProperty(String key) {
        String value = (String) properties.get(key);
        
        return value;
    } 

    public void setProperty(String key, String value) {
        properties.put(key, value);
    }       

    private Object createInstanceOf(String propertyName) {
        try {
            String propertyValue = getProperty(propertyName);
            Class propertyClass = Class.forName(propertyValue);
            Object propertyInstance = propertyClass.newInstance();
            return propertyInstance;
        } catch (Exception e) {
            return null;
        }
    }
}
