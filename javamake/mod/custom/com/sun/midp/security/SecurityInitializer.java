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

package com.sun.midp.security;





/**
 * A utility class that initializes internal security. Creates the internal
 * security token and supports its distribution to various packages around
 * the system that need it.
 * <p>
 * The security token is created here and can be passed to various
 * implementation classes around the system. There are two mechanisms
 * to pass the token. The fastest way is to pass the security token to
 * static methods of an implementation classes. These methods, typically
 * named <code>initSecurityToken()</code>, must each ensure they are called
 * only once. This technique works for classes other than those in public
 * API packages (that is, java.* and javax.*). This technique cannot be
 * used for class that reside in public API packages, since the
 * initialization method must be public and adding methods to public APIs
 * is prohibited. Also passing the token to lot of optional classes around
 * the system will cause the classes loading and static initialization,
 * which affects system performance and slowdowns system start up. That
 * is why only a few core system classes are handed with security token
 * over the explicit method call. For most of the other classes the
 * following alternative approach is used.
 * <p>
 * Any implementation class trusted by the internal security system can
 * request <code>SecurityInitializer</code> for security token. The check
 * whether a requester class is really trusted can be implemented in a
 * different ways, e.g. using static list of a trusted class names, or
 * using more specific features of the VM. The need in the optimized
 * implementation for the trusted classes check can be regarded at the
 * product porting time.
 * <p>
 * The approach with security token request on demand makes it possible
 * for numerous optional subsystem to be not loaded and initialized
 * until the very last moment when their functionality is really requested.
 * <p>
 * The important note about trusted classes check. In the case static list
 * of trusted class names is used for the check, it is important to prevent
 * ROMizer from these classes renaming at the build time. Otherwise security
 * system won't be able to identify requester classes by class name.
 */
public final class SecurityInitializer {

    /**
     * Internal implementation of the SecurityInitializer logic common
     * for other possible security initializer e.g. JSR specific ones.
     */
    private static SecurityToken internalSecurityToken = new SecurityToken();

    /**
     * Request security token using trusted object instance.
     * Note that the impossibility to create trusted objects
     * for untrusted requesters is the only guarantee of
     * secure tokens dispatching.
     *
     * @param trusted object to check whether caller have the right to
     *   request for security token
     * @return in the case transferred object is really trusted for
     *   SecurityInitializer the internal security token is returned,
     *   otherwise SecurityException will be thrown
     * @throws SecurityException in the case internal security system
     *   is uninitialized or transfered trusted object in unknown to
     *   <code>SecurityInitializer</code>
     */
    public static SecurityToken requestToken(
            ImplicitlyTrustedClass trusted) throws SecurityException {
        return internalSecurityToken;
    }

    /**
     * Explicitly init security token for core system classes
     * in the fastest possible way. The other optional classes
     * should request for security token on their own.
     */
    public static void initSystem() {

        com.sun.midp.io.j2me.push.PushRegistryInternal.initSecurityToken(
            internalSecurityToken);

    }
}
