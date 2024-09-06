/*
 *   
 *
 * Copyright  1990-2008 Sun Microsystems, Inc. All Rights Reserved.
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

 package com.sun.cldc.i18n.j2me;

 import java.io.*;
 import com.sun.cldc.i18n.StreamWriter;
 
 public class GBK_Writer_bk extends StreamWriter {
 
     private String encoding = "GBK";
 
     public Writer open(OutputStream out, String enc) throws UnsupportedEncodingException {
         if (enc != null) {
             encoding = enc;
         }
         this.out = out;
         return this;
     }
 
     public void write(int c) throws IOException {
         write(new char[]{(char)c}, 0, 1);
     }
 
     public void write(char[] cbuf, int off, int len) throws IOException {
         byte[] bytes = new String(cbuf, off, len).getBytes(encoding);
         out.write(bytes);
     }
 
     public void write(String str, int off, int len) throws IOException {
         byte[] bytes = str.substring(off, off + len).getBytes(encoding);
         out.write(bytes);
     }
 
     public int sizeOf(char[] array, int offset, int length) {
         try {
             return new String(array, offset, length).getBytes(encoding).length;
         } catch (UnsupportedEncodingException e) {
             return length;
         }
     }
 
     public void flush() throws IOException {
         super.flush();
     }
 
     public void close() throws IOException {
         super.close();
     }
     
 }
 