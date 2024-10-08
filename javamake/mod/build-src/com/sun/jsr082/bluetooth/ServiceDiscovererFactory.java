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
package com.sun.jsr082.bluetooth;

import com.sun.j2me.main.Configuration;

class ServiceDiscovererFactory {

    private static class ServiceDiscovererHolder {
        private final static ServiceDiscoverer INSTANCE
                = createServiceDiscoverer();
    }

    /*
     * Prevents from creating instances of the factory
     */
    private ServiceDiscovererFactory() {
    }

    /*
     * Returns an instance of ServiceDiscoverer
     *
     * @return ServiceDiscoverer instance
     */
    static ServiceDiscoverer getServiceDiscoverer() {
        return ServiceDiscovererHolder.INSTANCE;
    }

    /*
     * Creates an instance of ServiceDiscoverer
     */
    private static ServiceDiscoverer createServiceDiscoverer() {
        ServiceDiscoverer discoverer = null;

        String serviceDiscovererName = Configuration.getProperty(
                            "com.sun.jsr082.bluetooth.ServiceDiscoverer");
        if (serviceDiscovererName == null) {
            serviceDiscovererName = System.getProperty("com.sun.jsr082.bluetooth.ServiceDiscoverer");
        }

        if (serviceDiscovererName != null) {
            try {
                Class discClass = Class.forName(serviceDiscovererName);
                discoverer = (ServiceDiscoverer)discClass.newInstance();
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }




        return discoverer == null ? new ServiceSearcher() : discoverer;

    }
}
