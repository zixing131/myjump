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

package com.sun.cdc.io.j2me.file;

import java.io.IOException;
import java.util.Vector;

import com.sun.j2me.app.AppPackage;
import com.sun.j2me.jsr75.StringUtil;
import com.sun.j2me.main.Configuration;
import com.sun.j2me.log.Logging;
import com.sun.j2me.log.LogChannels;

/**
 * Default file handler.
 */
class DefaultFileHandler implements BaseFileHandler {

    /*
     * Placeholder for the file handle from the native layer.
     * Value of <code>0</code> indicates that file is either closed or
     * does not exists
     */
    /** Read handle. */
    private int readHandle  = 0;
    /** Write handle. */
    private int writeHandle = 0;

    /**
     * The full native path to the file.  Used by natives to access the file.
     */
    private String nativePath;

    /**
     * Native descriptor of the file while it is open for reading or writing.
     */
    private int nativeDescriptor = -1;

    /**
     * Whether or not the file is currently open for reading or writing.
     */
    private boolean isOpenForRead = false;
    private boolean isOpenForWrite = false;

    /** File name. */
    private long fileName   = 0;
    // The dir name is required when checking the fileSystem sizes
    /** Root directory. */
    private long rootDir    = 0;

    /** Illegal file name characters. */
    private static String illegalChars = null;

    /**
     * The flag is used for performance optimization.
     * <code>true</code> stands for it was detected
     * that private directory exists.
     */
    private static boolean privateDirExists = false;

    /** Length of the "file:///" URL prefix. */
    private static final int PREFIX_LEN = "file:///".length();

    /**
     * Init class info in the native code
     */
    static {
        initialize();

        illegalChars = illegalFileNameChars0();
        if (illegalChars == null) {
            illegalChars = "";
        }
    }

    /**
     * Connect file handler to the abstract file target. This operation should
     * not trigger any access to the native filesystem.
     *
     * @param rootName The name of the root directory.
     * @param fileName Full path to the file to be handled by this handler.
     *
     * @return native path/name.
     */
    public String connect(String rootName, String fileName) {
        if (rootName == null) {
            return null;
        }

        nativePath = getFullNativePath(rootName, fileName, true);
        // We don't set this.fileName because we don't use native pointers.
        // if (nativePath != null) {
        //     this.fileName = getNativeName(nativePath, this.fileName);
        // } else {
        //     if (Logging.REPORT_LEVEL <= Logging.ERROR) {
        //         Logging.report(Logging.ERROR, LogChannels.LC_STORAGE,
        //             "connect(): unable to get native path");
        //     }
        // }
        return nativePath;
    }

    /**
     * If necessary, creates dedicated private working directory for the MIDlet
     * suite.
     *
     * The method does nothing if specified root is not private root or
     * the directory already exists.
     *
     * @param rootName the name of file root
     *
     * @throws IOException if I/O error occures  
     */
    public void ensurePrivateDirExists(String rootName) throws IOException {
        if (rootName == null) {
            return;
        }

        if (!privateDirExists) { // we are not aware if the private dir exists
            String privateDir =
                    Configuration.getSystemProperty("fileconn.dir.private");

            if (privateDir != null) {
                // Trim the prefix, "file://".length == 7
                privateDir = privateDir.substring(7);

                if (rootName.regionMatches(true, 0, privateDir, 1,
                        rootName.length())) {
                    /*
                     * The root is a private root, i.e. the root where private
                     * directories of all suites are located.
                     */

                    BaseFileHandler fh = new DefaultFileHandler();
                    fh.connect(rootName, privateDir);

                    if (!fh.exists()) {
                        fh.mkdir();
                    }

                    privateDirExists = true;
                }
            }
        }
    }

    // JAVADOC COMMENT ELIDED - see FileConnection.list() description
    public Vector list(final String filter, final boolean includeHidden)
            throws IOException {

        Vector list = new Vector();

        long dirHandle = openDir();

        String fname = dirGetNextFile(dirHandle, includeHidden);
        while (fname != null) {
            // cleanname is passed to the filter and does not contain trailing
            // slash denoting directory
            String cleanname;
            if (fname.charAt(fname.length() - 1) == '/') {
                cleanname = fname.substring(0, fname.length() - 1);
            } else {
                cleanname = fname;
            }

            if (filterAccept(filter, cleanname)) {
                list.addElement(fname);
            }
            fname = dirGetNextFile(dirHandle, includeHidden);
        }

        closeDir(dirHandle);
        return list;
    }

    // JAVADOC COMMENT ELIDED - see FileConnection.create() description
    public native void create() throws IOException;

    /**
     * Check is file or directory corresponding to this filehandler exists.
     * @return <code>true</code> if the file/directory exists,
     *         <code>false</code> otherwise.
     */
    public native boolean exists();

    /**
     * Check is file corresponding to this filehandler exists and is a
     * directory.
     * @return <code>true</code> if pathname is a directory
     */
    public native boolean isDirectory();

    // JAVADOC COMMENT ELIDED - see FileConnection.delete() description
    public native void delete() throws IOException;

    // JAVADOC COMMENT ELIDED - see FileConnection.rename() description
    public void rename(String newName) throws IOException {
        // Start search of '/' from 1 to skip leading '/'
        // that means local machine in URL specification
        int rootEnd = newName.indexOf('/', 1);
        String rootName = newName.substring(1, rootEnd + 1);

        String nativePath = getFullNativePath(rootName, newName, false);
        if (nativePath != null) {
            rename0(nativePath);
            this.nativePath = nativePath;
        } else {
            if (Logging.REPORT_LEVEL <= Logging.ERROR) {
                Logging.report(Logging.ERROR, LogChannels.LC_STORAGE,
                    "rename(): unable to get native path");
            }
        }
    }

    /**
     * Helper method that renames the file.
     * @param newName new name for the file
     * @throws IOException if any error occurs
     */
    private native void rename0(String newName) throws IOException;

    // JAVADOC COMMENT ELIDED - see FileConnection.truncate() description
    public native void truncate(long byteOffset) throws IOException;

    // JAVADOC COMMENT ELIDED - see FileConnection.fileSize() description
    public native long fileSize() throws IOException;

    // JAVADOC COMMENT ELIDED - see FileConnection.directorySize() description
    public native long directorySize(boolean includeSubDirs) throws IOException;

    /**
     * Check is file corresponding to this filehandler exists and has a
     * read permission.
     * @return <code>true</code> if the file can be read
     */
    public native boolean canRead();

    /**
     * Check is file corresponding to this filehandler exists and has a
     * write permission.
     * @return <code>true</code> if the file can be written
     */
    public native boolean canWrite();

    /**
     * Check is file corresponding to this filehandler exists and is
     * hidden.
     * @return <code>true</code> if the file is not visible
     */
    public boolean isHidden() {
        // Note: ANSI C does not define hidden files.
        // Sure, on UNIX systems a file is considered to be hidden
        // if its name begins with a period character ('.'), but we can not
        // rename files during setHidden() method, so we consider
        // what hidden files are not supported on UNIX systems, and this method
        // always returns false on UNIX as it's required by JSR 75 spec.
        return isHidden0();
    }

    /**
     * Helper method that checks if the file is visible.
     * @return <code>true</code> if the file is not visible
     */
    private native boolean isHidden0();

    // JAVADOC COMMENT ELIDED - see FileConnection.setReadable() description
    public native void setReadable(boolean readable) throws IOException;

    // JAVADOC COMMENT ELIDED - see FileConnection.setWritable() description
    public native void setWritable(boolean writable) throws IOException;

    // JAVADOC COMMENT ELIDED - see FileConnection.setHidden() description
    public void setHidden(boolean hidden) throws IOException {
        setHidden0(hidden);
    }

    /**
     * Helper method that marks the file hidden flag.
     * @param hidden <code>true</code> to make file as not visible
     * @throws IOException if any error occurs
     */
    private native void setHidden0(boolean hidden) throws IOException;

    // JAVADOC COMMENT ELIDED - see FileConnection.mkdir() description
    public native void mkdir() throws IOException;

    // JAVADOC COMMENT ELIDED - see FileConnection.availableSize() description
    public native long availableSize();

    // JAVADOC COMMENT ELIDED - see FileConnection.totalSize() description
    public native long totalSize();

    // JAVADOC COMMENT ELIDED - see FileConnection.usedSize() description
    public long usedSize() {
        return totalSize() - availableSize();
    }

    /**
     * Returns a string that contains all characters forbidden for the use on
     * the given platform except "/" (forward slash) which is always considered
     * illegal. If there are no such characters an empty string is returned.
     * @return string of illegal file name characters
     */
    public String illegalFileNameChars() {
        return illegalChars;
    }

    /**
     * Returns the time that the file denoted by this file handler
     * was last modified.
     * @return The time then last modification of the file took place.
     */
    public native long lastModified();

    /**
     * Opens the file for reading.
     * @throws IOException if any error occurs during input/output operations.
     */
    public native void openForRead() throws IOException;

    /**
     * Closes the file for reading.
     * @throws IOException if any error occurs during input/output operations.
     */
    public native void closeForRead() throws IOException;

    /**
     * Opens the file for writing.
     * @throws IOException if any error occurs during input/output operations.
     */
    public native void openForWrite() throws IOException;

    /**
     * Closes the file for writing.
     * @throws IOException if any error occurs during input/output operations.
     */
    public native void closeForWrite() throws IOException;

    /**
     * Closes the file for both reading and writing.
     * @throws IOException if any error occurs during input/output operations.
     */    
    public native void closeForReadWrite() throws IOException;

    /**
     * Reads data from the file to an array.
     * @param b array for input data
     * @param off index in the input array
     * @param len length of data to read
     * @return length of data really read
     * @throws IOException if any error occurs.
     */
    public native int read(byte b[], int off, int len) throws IOException;

    public native long skip(long n) throws IOException;

    /**
     * Write data from an array to the file.
     * @param b array of output data
     * @param off index in the output array
     * @param len length of data to write
     * @return length of data really written
     * @throws IOException if any error occurs.
     */
    public native int write(byte b[], int off, int len) throws IOException;

    /**
     * Sets the next write location.
     * @param offset seek position for next write
     * @throws IOException if any error occurs.
     */
    public native void positionForWrite(long offset) throws IOException;

    /**
     * Flushes any output to the file.
     * @throws IOException if any error occurs.
     */
    public native void flush() throws IOException;

    /**
     * Close file associated with this handler. Open file and all system
     * resources should be released by this call. Handler object can be
     * reused by subsequent call to connect().
     *
     * @throws IOException if I/O error occurs
     */
    public native void close() throws IOException;

    /**
     * Replace all entries of the "//" with "/" (multiple separators
     * with single separator) and all "/" with the native separator.
     *
     * @param name StringBuffer to process
     * @param off offset from where to start the conversion
     * @param len length to convert
     *
     * @return the same StringBuffer after the process
     */
    private StringBuffer pathToNativeSeparator(StringBuffer name,
                            int off, int len) {

        int  length = off + len;
        int  curr   = off;
        char sep    = getFileSeparator();

        while ((curr + 1) < length) {
            if (name.charAt(curr) == '/' && name.charAt(curr+1) == '/') {
                name.deleteCharAt(curr);
                length--;
                continue;
            } else if (name.charAt(curr) == '/') {
                name.setCharAt(curr, sep);
            }
            curr++;
        }

        // trim trailing slash if it exists
        if (name.charAt(length - 1) == '/') {
            name.deleteCharAt(length - 1);
        }

        return name;
    }

    /**
     * Check that given string matches the given filter. See
     * the FileConnection specification for details on filters.
     * Filter value of null matches any string.
     *
     * @param filter string against witch to match
     * @param str    string to be matched
     *
     * @return true is str matches the filter of if filter is null,
     *         otherwise false
     */
    private static boolean filterAccept(String filter, String str) {

        if (filter == null) {
            return true;
        }

        if (filter.length() == 0) {
            return false;
        }

        int  currPos = 0;
        int currComp = 0, firstSigComp = 0;
        int idx;

        // Splitted string does not contain separators themselves
        String components[] = StringUtil.split(filter, '*', 0);

        // if filter does not begin with '*' check that string begins with
        // filter's first component
        if (filter.charAt(0) != '*') {
            if (!str.startsWith(components[0])) {
                return false;
            } else {
                currPos += components[0].length();
                currComp++;
                firstSigComp = currComp;
            }
        }

        // Run on the string and check that it contains all filter
        // components sequentially
        int strLen = str.length();
        for (; currComp < components.length; currComp++) {
            int compLen = components[currComp].length();
            // Looking for empty component at str.length() is a special case
            if (currPos != strLen || compLen != 0) { 
                idx = str.indexOf(components[currComp], currPos);
                if (idx != -1) {
                    currPos = idx + compLen;
                } else {
                    // run out of the string while filter components remain
                    return false;
                }
            }
        }

        // At this point we run out of filter. First option is that
        // filter ends with '*', or string is finished,
        // we are fine then, and accept the string.
        //
        // In the other case we check that string ends with the last component
        // of the filter (given that there was an asterisk before the last
        // component
        if (!(filter.charAt(filter.length() - 1) == '*'
                || currPos == strLen)) {
            if (components.length > firstSigComp) {
                // does string end with the last filter component?
                if (!str.endsWith(components[components.length - 1])) {
                    return false;
                }
            } else {
                // there was no asteric before last filter component
                return false;
            }
        }

        // If we got here string is accepted
        return true;
    }

    /**
     * Converts the given virtual path to the fully qualified native path.
     *
     * @param rootName name of the virtual root the given path belongs to.
     * @param fileName virtual path to be converted.
     * @param storeRootDir if <code>true</code>, the root directory will be
     *                     stored in a native pointer.
     * @return full native path.
     */
    private String getFullNativePath(String rootName, String fileName,
        boolean storeRootDir) {
        int rootNameLen = rootName.length();
        if (rootNameLen == 0) {
            return null;
        }

        String rootPath = getNativePathForRoot(rootName);
        if (rootPath == null) {
            return null;
        }

        // We don't set this.rootDir because we don't use native pointers.
        // if (storeRootDir) {
        //     this.rootDir = getNativeName(rootPath, this.rootDir);
        // }

        StringBuffer name = new StringBuffer(rootPath);
        int rootPathLen = name.length();

        int fileNameLen = fileName.length();
        if (fileNameLen != 0) {
            // Add 1 because fileName, unlike rootName, has leading '/'
            name.append(fileName.substring(rootNameLen + 1));
        }

        // If the file is in the private directory, adjust the path
        //
        // Commented out because each installation is configured
        // to install and run a single midlet, so it isn't necessary
        // to partition the Private filesystem root in this way.
        //
        // String privateDirURL =
        //     Configuration.getSystemProperty("fileconn.dir.private");
        // if (privateDirURL != null) {
        //     int privateDirURLLen = privateDirURL.length();
        //
        //     /*
        //      * Check if fileName starts with the private directory path,
        //      * i.e. private directory URL without leading "file:///".
        //      * The first '/' in fileName is skipped.
        //      */
        //     if (privateDirURLLen > 0 && fileName.regionMatches(true, 1,
        //         privateDirURL, PREFIX_LEN, privateDirURLLen - PREFIX_LEN)) {
        //
        //         // Length of the private directory path, i.e. without leading
        //         // ("file:///" + rootName)
        //         int privatePathLen = privateDirURLLen - PREFIX_LEN -
        //             rootNameLen;
        //
        //         // Insert suite ID immediately after the private directory path
        //         name.insert(rootPathLen + privatePathLen,
        //             getSuiteIdString(AppPackage.getInstance().getId()) +
        //             getFileSeparator());
        //     }
        // }

        pathToNativeSeparator(name, rootPathLen,
            name.length() - rootPathLen);
        return name.toString();
    }

    /**
     * Return pointer to the system-dependent file name stored in the native
     * code.
     *
     * @param name a string representing the filename to convert to native
     *             the form
     * @return A pointer to the system-dependent file name
     */
    private native static long getNativeName(String name, long oldName);

    /**
     * Gets the system-dependent file separator character.
     * @return The file separator character.
     */
    public native static char getFileSeparator();

    /**
     * Opens the directory.
     * @return native pointer to an opaque filelist structure used by
     *         methods iterating over file list.
     */
    private native long openDir();

    /**
     * Closes the directory.
     * @param dirHandle native pointer to an opaque filelist structure
     *         returned by openDir method.
     */
    private native void closeDir(long dirHandle);

    /**
     * Gets the next file in directory.
     * @param dirHandle native pointer to a filelist structure
     *                  returned by <code>openDir</code>
     * @param includeHidden determines whether it's necessary
     *                      to include hidden files and directories
     * @return the name of the file.
     */
    private native String dirGetNextFile(long dirHandle, boolean includeHidden);

    /**
     * Gets OS path for the specified file system root.
     * @param root root name
     * @return The path to access the root
     */
    private native String getNativePathForRoot(String root);

    /**
     * Gets the list of illegal characters in file names.
     * @return A string containing the characters
     *         that are not allowed inside file names.
     */
    private native static String illegalFileNameChars0();

    /**
     * Initializes native part of file handler.
     */
    private native static void initialize();

    /**
     * Converts the ID of the current MIDlet suite to string form.
     *
     * @param id the MIDlet suite ID.
     * @return resulting string representation of the MIDlet suite ID.
     */
    private native static String getSuiteIdString(int id);

    /**
     * Cleanup after garbage collected instance.
     */



    private native void finalize();

}
