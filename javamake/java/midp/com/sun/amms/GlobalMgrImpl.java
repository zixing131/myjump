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

package com.sun.amms;

import java.util.Hashtable;
import javax.microedition.amms.Spectator;
import javax.microedition.amms.SoundSource3D;
import javax.microedition.amms.MediaProcessor;
import javax.microedition.media.MediaException;
import javax.microedition.media.Control;
import javax.microedition.media.Controllable;

import com.sun.mmedia.Configuration;

// implements Singleton pattern
public class GlobalMgrImpl extends AbstractDirectControllable
{
    private static GlobalMgrImpl _instance;   // singleton instance
    private static Hashtable     _processors; // mapping of mime types to media processor implementations
    
    public static GlobalMgrImpl getInstance()
    {
        if( null == _processors )
        {
            _processors = new Hashtable( 3 );
            _processors.put( Configuration.MIME_IMAGE_RAW, "com.sun.amms.imageprocessor.ObjectImageProcessor" );
            _processors.put( Configuration.MIME_IMAGE_JPEG, "com.sun.amms.imageprocessor.StreamImageProcessor" );
            _processors.put( Configuration.MIME_IMAGE_PNG, "com.sun.amms.imageprocessor.StreamImageProcessor" );
        }

        if( _instance == null )
        {
            _instance = new GlobalMgrImpl();
        }
        return _instance;
    }
    
    // constructor can be called only from static method getInstance()
    private GlobalMgrImpl()
    {
        _peer = nCreatePeer();
        _mp_listener = AMMSMPEventListener.getInstance();
    }
    
    private int                 _peer = 0;
    private DirectSpectatorImpl _spectator_impl;
    private AMMSMPEventListener _mp_listener;

    private native int nCreatePeer();

    private native int nGetControlPeer( byte[] typeName );
    protected int getControlPeer(String controlType)
    {
        return nGetControlPeer( controlType.getBytes() ); 
    }

    private native int nGetNumOfSupportedControls();
    private native void nGetSupportedControlNames( String [] names );
    protected String [] getSupportedControlNames()
    {
        int number = nGetNumOfSupportedControls();
        if( number <= 0 )
        {
            return new String [0];
        }
        
        String [] names = new String [ number ];
        nGetSupportedControlNames( names );
        return names;
    }
    
    public Controllable getSpectatorImpl() throws MediaException
    {
        if( _spectator_impl == null )
        {
            _spectator_impl = createSpectatorImpl();
        }
        
        return _spectator_impl;
    }
    
    private DirectSpectatorImpl createSpectatorImpl() throws MediaException
    {
        int native_spectator_peer = nGetSpectatorPeer();
        if( native_spectator_peer == 0 )
        {
            throw new MediaException( "Spectator is not supported" );
        }
        
        return new DirectSpectatorImpl( native_spectator_peer );
    }
    
    private native int nGetSpectatorPeer();

    public SoundSource3D createSoundSource3D() throws MediaException
    {
        int source3d_native_peer = nCreateSoundSource3D();
        if( source3d_native_peer == 0 )
        {
            throw new MediaException( "SoundSource3D is not supported" );
        }
        return new DirectSoundSource3D( _peer,  source3d_native_peer );
    }
    
    private native int nCreateSoundSource3D();

    public String [] getSupportedSoundSource3DPlayerTypes()
    {
        int n = nGetNumOf3DPlayerTypes();
        if ( n <= 0 )
        {
            return new String [0];
        }
        String [] types = new String [ n ];
        
        nGetSupportedSoundSource3DPlayerTypes( types );
        return types;
    }
    
    private native int nGetNumOf3DPlayerTypes();
    private native void nGetSupportedSoundSource3DPlayerTypes( 
            String [] types );

    public String [] getSupportedMediaProcessorInputTypes()
    {
        // IMPL_NOTE: this call should be forwarded to javacall, 
        //            in the same manner as getSupportedSoundSource3DPlayerTypes()
        return new String[] { Configuration.MIME_IMAGE_PNG,
                              Configuration.MIME_IMAGE_JPEG,
                              Configuration.MIME_IMAGE_RAW };
    }

    public MediaProcessor createMediaProcessor(String inputType) throws MediaException
    {
        if( null == inputType )
        {
            throw new MediaException( "Null input type" );
        }
       
        String mpName = (String)_processors.get(inputType);

        if( null == mpName )
        {
            throw new MediaException( "Input type '" + inputType + "' is not supported" );
        }

        MediaProcessor mp;

        try
        {
            mp = (MediaProcessor)Class.forName( mpName ).newInstance();
        }
        catch( Exception e )
        {
            throw new MediaException( "Creation of '" + mpName + "' failed:" + e.getMessage() );
        }

        return mp;
    }

    


    private native void finalize();
    
}
