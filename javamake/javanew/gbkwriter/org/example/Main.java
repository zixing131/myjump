package org.example;

import com.sun.cldc.i18n.j2me.GBK_Reader;

public class Main {
    public static void main(String[] args) throws ClassNotFoundException {
        System.out.println("Hello world!");
        GBK_Reader reader = new GBK_Reader();
        System.out.println("reader : "+reader);
    }
}