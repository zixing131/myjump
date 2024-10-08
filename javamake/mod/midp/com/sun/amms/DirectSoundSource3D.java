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

import javax.microedition.amms.SoundSource3D;
import javax.microedition.media.Player;
import javax.microedition.media.MediaException;

import com.sun.mmedia.DirectPlayer;
import com.sun.mmedia.PlayerImpl;
import com.sun.mmedia.PlayerStateSubscriber;

public class DirectSoundSource3D extends BasicDirectModule
        implements SoundSource3D, PlayerStateSubscriber
{
    private int _peer = 0;
    private int _managerPeer; // needed for the native finalizer
    private DirectSoundSource3D() {}
    
    public DirectSoundSource3D( int managerPeer, int peer )
    {
        _peer = peer;
        _managerPeer = managerPeer;
    }
    
    private native int nGetControlPeer( byte[] typeName );
    protected int getControlPeer( String controlType )
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
    
    private native void nAddMIDIChannel( int player_handle, int channel )
    throws MediaException;

    private PlayerImpl getPlayerImpl(Player player) throws  MediaException
    {
        PlayerImpl pimpl;

        try {
            pimpl = (PlayerImpl)player;
        } catch (ClassCastException cce) {
            throw new MediaException("This Player type is not supported");
        }
        return pimpl;

    }

    private DirectPlayer getDirectPlayer( Player player ) throws MediaException
    {
        PlayerImpl pimpl;
        DirectPlayer dp;
        try {
            pimpl = (PlayerImpl)player;
            dp = (DirectPlayer)( pimpl.getPlayerInst() );
            if (null == dp) {
                throw new MediaException("Player is not completely created");
            }
        } catch( ClassCastException cce ) {
            throw new MediaException("This Player type is not supported");
        }
        
        return dp;
    }
    
    public void doAddMIDIChannel( Player player, int channel )
        throws MediaException
    {
        DirectPlayer dp = getDirectPlayer( player );
        
        nAddMIDIChannel( dp.getNativeHandle() , channel );
    }

    private native void nAddPlayer( int player_handle ) throws MediaException;
    private native void nCheckSupported( int player_handle ) throws MediaException;
    
    public void doAddPlayer( Player player ) throws MediaException
    {
        PlayerImpl pimpl = getPlayerImpl(player);
        if (pimpl.getState() != Player.CLOSED) {
            pimpl.state_subscriber = this;
            if (pimpl.getState() >= Player.REALIZED) {
                PlayerRealized(player);
            }
        }
    }

    public void PlayerRealized(Player player) throws MediaException {
        DirectPlayer dp = getDirectPlayer(player);
        nCheckSupported(dp.getNativeHandle());
    }

    public void PlayerPrefetched(Player player) throws MediaException
    {
        if( isAddedWholly( player ) )
        {
            DirectPlayer dp = getDirectPlayer(player);
            nAddPlayer(dp.getNativeHandle());
        }
    }
    
    public void PlayerDeallocated( Player player )
    {
        if( isAddedWholly( player ) )
        {
            try{
                DirectPlayer dp = getDirectPlayer(player);
                nRemovePlayer(dp.getNativeHandle());
            } catch ( MediaException me ) {}
        }
    }

    private native void nRemoveMIDIChannel( int player_handle, int channel );
    public void doRemoveMIDIChannel( Player player, int channel )
    {
        try
        {
            DirectPlayer dp = getDirectPlayer(player);
            int hNative = dp.getNativeHandle();
            if (0 != hNative) nRemoveMIDIChannel(hNative, channel);
        }
        catch (MediaException e)
        {
            // do nothing.
            // We won't get here, if player wasn't sucessfully added,
            // and if it was, it's right type of Player.
        }
    }
    
    private native void nRemovePlayer( int player_handle );
    public void doRemovePlayer( Player player )
    {
        try
        {
            /* no need to perform native removal here because only
             * the following two situations are possible
             * 1) it has already been done in PlayerDeallocated() 
             * 2) The Player is closed and the removal has been performed in 
             *    the native close procedure.
             */
            PlayerImpl pimpl = getPlayerImpl(player);
            if ( pimpl != null ) {
                pimpl.state_subscriber = null;
            }
        }
        catch (MediaException e)
        {
            // do nothing.
            // We won't get here, if player wasn't sucessfully added,
            // and if it was, it's right type of Player.
        }
    }

    


    private native void finalize();
    
}
