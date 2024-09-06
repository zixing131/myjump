package javax.microedition.media;

import com.sun.mmedia.Configuration;
import com.sun.mmedia.PlayerImpl;
import com.sun.mmedia.TonePlayer;
import com.sun.mmedia.protocol.BasicDS;
import com.sun.mmedia.protocol.CommonDS;
import java.io.IOException;
import java.io.InputStream;
import javax.microedition.media.protocol.DataSource;
 
public final class Manager {
    private static TonePlayer tonePlayer;
    public static final String TONE_DEVICE_LOCATOR = "device://tone";
    public static final String MIDI_DEVICE_LOCATOR = "device://midi";
    public static final String CONTENT_TYPE_MIDI = "audio/midi";
    public static final String CONTENT_TYPE_XMIDI = "audio/x-midi";
    public static final String CONTENT_TYPE_XWAVE = "audio/x-wav";
    public static final String CONTENT_TYPE_WAVE = "audio/wav";
    public static final String CONTENT_TYPE_TONE = "audio/x-tone-seq";
    public static final String CONTENT_TYPE_AMR = "audio/amr";
    private static Configuration config = Configuration.getConfiguration();
    private static String DS_ERR = "Cannot create a DataSource for: ";
    private static String PL_ERR = "Cannot create a Player for: ";
    private static TimeBase sysTimeBase = null;

    private Manager() {
    }

    public static String[] getSupportedContentTypes(String str) {
        return new String[]{"audio/midi", CONTENT_TYPE_XMIDI, "audio/x-wav", "audio/wav", "audio/x-tone-seq", "audio/amr"};
    }

    public static String[] getSupportedProtocols(String str) {
        return config.getSupportedProtocols(str);
    }

    public static Player createPlayer(String str) throws IOException, MediaException {
        if (str == null) {
            throw new IllegalArgumentException();
        }
        String lowerCase = str.toLowerCase();
        System.out.println(new StringBuffer().append("[mmapi] createPlayer with ").append(str).toString());
        boolean z = false;
        int indexOf = lowerCase.indexOf(58);
        if (indexOf == -1) {
            throw new MediaException("Malformed locator");
        }
        String substring = lowerCase.substring(0, indexOf);
        if (lowerCase.startsWith(Configuration.RADIO_CAPTURE_LOCATOR)) {
            if (!config.isRadioSupported()) {
                throw new MediaException("Radio Capture is not supported");
            }
            parseRadioLocatorStr(str);
        } else if (lowerCase.startsWith(Configuration.AUDIO_CAPTURE_LOCATOR) || lowerCase.startsWith(Configuration.VIDEO_CAPTURE_LOCATOR)) {
            int indexOf2 = str.indexOf(63);
            String str2 = null;
            if (indexOf2 > 0) {
                lowerCase = lowerCase.substring(0, indexOf2);
                int indexOf3 = str.indexOf("encoding=");
                if (indexOf3 != -1) {
                    str2 = str.substring(indexOf3 + 9);
                    if (str2 != null) {
                        int indexOf4 = str2.indexOf(38);
                        if (indexOf4 > 0) {
                            str2 = str2.substring(0, indexOf4);
                        }
                        str2 = str2.toLowerCase();
                    }
                }
            }
            boolean z2 = true;
            String str3 = null;
            if (lowerCase.equals(Configuration.AUDIO_CAPTURE_LOCATOR)) {
                String property = System.getProperty("supports.audio.capture");
                str3 = System.getProperty("audio.encodings");
                if (property == null || property.equals("false") || str3 == null) {
                    z2 = false;
                }
            } else if (lowerCase.equals(Configuration.VIDEO_CAPTURE_LOCATOR)) {
                String property2 = System.getProperty("supports.video.capture");
                str3 = System.getProperty("video.encodings");
                if (property2 == null || property2.equals("false") || str3 == null) {
                    z2 = false;
                }
            }
            if (str2 != null && str3 != null && str3.indexOf(str2) == -1) {
                z2 = false;
            }
            if (!z2) {
                throw new MediaException(new StringBuffer().append("Player cannot be created for ").append(str).toString());
            }
        } else {
            String[] supportedProtocols = getSupportedProtocols(null);
            for (int i = 0; i < supportedProtocols.length && !z; i++) {
                if (substring.equals(supportedProtocols[i])) {
                    z = true;
                }
            }
            if (!z) {
                throw new MediaException(new StringBuffer().append("Player cannot be created for ").append(str).append(" Unsupported protocol ").append(substring).toString());
            }
        }
        DataSource createDataSource = createDataSource(str);
        try {
            return createPlayer(createDataSource);
        } catch (IOException e) {
            createDataSource.disconnect();
            throw e;
        } catch (MediaException e2) {
            createDataSource.disconnect();
            throw e2;
        }
    }

    private static void parseRadioLocatorStr(String str) throws MediaException {
        int length = Configuration.RADIO_CAPTURE_LOCATOR.length();
        if (null == str) {
            throw new MediaException("radio locator is null");
        }
        if (!str.startsWith(Configuration.RADIO_CAPTURE_LOCATOR)) {
            throw new MediaException("bad radio locator");
        }
        if (str.length() == length) {
            return;
        }
        if (str.charAt(length) != '?') {
            throw new MediaException("bad radio locator");
        }
        parseRadioParamsString(str.substring(length + 1));
    }

    private static void parseRadioParamsString(String str) throws MediaException {
        int indexOf;
        boolean z = false;
        boolean z2 = false;
        boolean z3 = false;
        boolean z4 = false;
        boolean z5 = false;
        int i = 0;
        do {
            indexOf = str.indexOf(38, i);
            String substring = indexOf < 0 ? str.substring(i) : str.substring(i, indexOf);
            if (substring.startsWith("f=")) {
                if (z) {
                    throw new MediaException("frequency is set more than once in the radio locator string");
                }
                parseRadioFreqParam(substring);
                z = true;
            } else if (substring.startsWith("mod=")) {
                if (z2) {
                    throw new MediaException("modulation is set more than once in the radio locator string");
                }
                parseRadioModParam(substring);
                z2 = true;
            } else if (substring.startsWith("st=")) {
                if (z3) {
                    throw new MediaException("stereo mode is set more than once in the radio locator string");
                }
                parseRadioStereoParam(substring);
                z3 = true;
            } else if (substring.startsWith("id=")) {
                if (z4) {
                    throw new MediaException("Program ID is set more than once in the radio locator string");
                }
                parseRadioIdParam(substring);
                z4 = true;
            } else {
                if (!substring.startsWith("preset=")) {
                    throw new MediaException("Unknown parameter in the radio locator string");
                }
                if (z5) {
                    throw new MediaException("Preset is set more than once in the radio locator string");
                }
                parseRadioPresetParam(substring);
                z5 = true;
            }
            i = indexOf + 1;
        } while (indexOf >= 0);
    }

    private static void parseRadioFreqParam(String str) throws MediaException {
        String str2 = str;
        if ('M' == str2.charAt(str2.length() - 1) || 'k' == str2.charAt(str2.length() - 1)) {
            str2 = str2.substring(0, str2.length() - 1);
        }
        try {
            if (0.0f >= Float.parseFloat(str2.substring(2))) {
                throw new MediaException("Frequency is not positive in the radio locator string");
            }
        } catch (NumberFormatException e) {
            throw new MediaException("Frequency is not numeric or too big in the radio locator string");
        }
    }

    private static void parseRadioModParam(String str) throws MediaException {
        String substring = str.substring("mod=".length());
        if (!substring.equals("am") && !substring.equals("fm")) {
            throw new MediaException("Unknown modulation in the radio locator string parameters");
        }
    }

    private static void parseRadioStereoParam(String str) throws MediaException {
        String substring = str.substring("st=".length());
        if (!substring.equals("mono") && !substring.equals("stereo") && !substring.equals("auto")) {
            throw new MediaException("Unknown stereo mode in the radio locator string parameters");
        }
    }

    private static void parseRadioIdParam(String str) throws MediaException {
        String substring = str.toLowerCase().substring("id=".length());
        if (0 == substring.length()) {
            throw new MediaException("Empty Program ID name in the radio locator string parameters");
        }
        for (int i = 0; i < substring.length(); i++) {
            char charAt = substring.charAt(i);
            if (!Character.isLowerCase(charAt) && !Character.isDigit(charAt)) {
                throw new MediaException("Not an alphanumeric Program ID in the radio locator string parameters");
            }
        }
    }

    private static void parseRadioPresetParam(String str) throws MediaException {
        try {
            if (0 >= Byte.parseByte(str.substring("preset=".length()))) {
                throw new MediaException("Preset number is not positive in the radio locator string");
            }
        } catch (NumberFormatException e) {
            throw new MediaException("Preset number is not numeric or too big in the radio locator string");
        }
    }

    public static Player createPlayer(InputStream inputStream, String str) throws IOException, MediaException {
        if (inputStream == null) {
            throw new IllegalArgumentException();
        }
        if (str == null) {
            throw new MediaException(new StringBuffer().append(PL_ERR).append("cannot determine the media type").toString());
        }
        String lowerCase = str.toLowerCase();
        CommonDS commonDS = new CommonDS();
        commonDS.setInputStream(inputStream);
        commonDS.setContentType(lowerCase);
        try {
            return createPlayer(commonDS);
        } catch (IOException e) {
            throw new MediaException(new StringBuffer().append(PL_ERR).append(e.getMessage()).toString());
        }
    }

    public static void playTone(int i, int i2, int i3) throws MediaException {
        if (i < 0 || i > 127 || i2 <= 0) {
            throw new IllegalArgumentException(new StringBuffer().append("Invalid note(").append(i).append(") or duration (").append(i2).append(")").toString());
        }
        if (i3 < 0) {
            i3 = 0;
        } else if (i3 > 100) {
            i3 = 100;
        }
        if (i2 == 0 || i3 == 0) {
            return;
        }
        if (tonePlayer == null) {
            tonePlayer = config.getTonePlayer();
        }
        if (tonePlayer == null) {
            throw new MediaException("no tone player");
        }
        tonePlayer.playTone(i, i2, i3);
    }

    public static Player createPlayer(DataSource dataSource) throws IOException, MediaException {
        String str;
        int indexOf;
        if (dataSource == null) {
            throw new IllegalArgumentException();
        }
        try {
            str = dataSource.getContentType();
        } catch (IllegalStateException e) {
            str = null;
        }
        if (str != null) {
            String str2 = null;
            String locator = dataSource.getLocator();
            if (locator != null && (indexOf = locator.indexOf(58)) != -1) {
                str2 = locator.substring(0, indexOf);
            }
            String[] supportedContentTypes = getSupportedContentTypes(str2);
            boolean z = false;
            for (int i = 0; i < supportedContentTypes.length && !z; i++) {
                if (str.equals(supportedContentTypes[i])) {
                    z = true;
                }
            }
            if (!z) {
                throw new MediaException(new StringBuffer().append("Player cannot be created for ").append(str).toString());
            }
        }
        System.out.println(new StringBuffer().append("create player : ").append(str).toString());
        return new PlayerImpl(dataSource);
    }

    private static DataSource createDataSource(String str) throws IOException, MediaException {
        String protocolHandler = config.getProtocolHandler(BasicDS.getProtocol(str));
        if (protocolHandler == null) {
            throw new MediaException(new StringBuffer().append(DS_ERR).append(str).toString());
        }
        try {
            DataSource dataSource = (DataSource) Class.forName(protocolHandler).newInstance();
            ((BasicDS) dataSource).setLocator(str);
            if (str.equals("device://tone")) {
                ((BasicDS) dataSource).setContentType("audio/x-tone-seq");
            } else if (str.equals("device://midi")) {
                ((BasicDS) dataSource).setContentType("audio/midi");
            }
            return dataSource;
        } catch (MediaException e) {
            throw e;
        } catch (Exception e2) {
            throw new MediaException(new StringBuffer().append(DS_ERR).append(e2.getMessage()).toString());
        }
    }

    public static TimeBase getSystemTimeBase() {
        if (sysTimeBase == null) {
            sysTimeBase = new SystemTimeBase();
        }
        return sysTimeBase;
    }
}