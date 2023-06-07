var start = performance.now();
// java/lang/Integer extends java/lang/Object
// java/lang/Integer.toString.(II)Ljava/lang/String; ($G_HAwZDR_0)
function $G_HAwZDR_0(self,a,b) {
 var re,na,sa=$.SA;
 var c=0,d=0,e=0;
 var A=0,B=0,C=0,D=0,E=0,F=0;
 var pc=0;
 if(O){
   var nt=$.ctx.nativeThread;
   var fp=nt.fp;
   var lp=fp-5;
   a=i32[lp+0],b=i32[lp+1],c=i32[lp+2],d=i32[lp+3],e=i32[lp+4];
   pc=nt.pc;
   nt.popFrame(O);
   nt.pushMarkerFrame(1073741824);
   O=null;
 }
 var label=0;
 // Entry Dispatch Block
 if (pc===0) {
 label = 1;
 } else if (!(pc===40)) {
 }
 if (label == 1) {
 A=b;
 B=2;
 if (A<B) {
 label = 3;
 } else {
 A=b;
 B=36;
 if (!(A<=B)) {
 label = 3;
 }
 }
 if (label == 3) {
 A=10;
 b=A;
 }
 A=33;
 A<0&&TS();
 na=A
 A=MA(8+na*2);
 i32[A+0>>2]=36
 i32[A+4>>2]=na
 c=A;
 A=a;
 if (A>=0) {
 A=0;
 } else {
 A=1;
 }
 d=A;
 A=32;
 e=A;
 A=d;
 if (!(A!==0)) {
 A=a;
 A=(- A)|0;
 a=A;
 }
 }
 while(1) {
 A=a;
 B=b;
 B=(- B)|0;
 if (A>B) {
 break;
 }
 A=c;
 B=e;
 e=e+-1|0;
 C=i32[sa[$C0]+16>>2];
 D=a;
 E=b;
 !E&&TA();
 D=D%E;
 D=(- D)|0;
 !C&&TN();
 if((D>>>0)>=(i32[C+4>>2]>>>0))TI(D);
 C=u16[(C+8>>1)+D|0];
 if((B>>>0)>=(i32[A+4>>2]>>>0))TI(B);
 u16[(A+8>>1)+B|0]=C;
 A=a;
 B=b;
 !B&&TA();
 A=A/B|0;
 a=A;
 }
 A=c;
 B=e;
 C=i32[sa[$C0]+16>>2];
 D=a;
 D=(- D)|0;
 !C&&TN();
 if((D>>>0)>=(i32[C+4>>2]>>>0))TI(D);
 C=u16[(C+8>>1)+D|0];
 if((B>>>0)>=(i32[A+4>>2]>>>0))TI(B);
 u16[(A+8>>1)+B|0]=C;
 A=d;
 if (A===0) {
 A=AO(CI[$C1]);
 B=A;
 C=c;
 D=e;
 E=33;
 F=e;
 E=E-F|0;
 !B&&TN();
 re=(LM[$M1_3]||GLM($M1_3))(B,C,D,E);
 return A;
 }
 A=c;
 e=e+-1|0;
 B=e;
 C=45;
 if((B>>>0)>=(i32[A+4>>2]>>>0))TI(B);
 u16[(A+8>>1)+B|0]=C;
 A=AO(CI[$C1]);
 B=A;
 C=c;
 D=e;
 E=33;
 F=e;
 E=E-F|0;
 !B&&TN();
 re=(LM[$M1_3]||GLM($M1_3))(B,C,D,E);
 return A;
 
}
AOTMD["$G_HAwZDR_0"] = {"osr":[40]};
$G_HAwZDR.classSymbols = ["java/lang/Integer", "java/lang/String"];
// java/lang/Long extends java/lang/Object
// java/lang/Long.hashCode.()I ($G$tnWvIO_9)
function $G$tnWvIO_9(a) {
 var ea;
 var self=a;
 var A=0,B=0,C=0,D=0,E=0;
 var pc=0;
 var label=0;
 A=a;
 !A&&TN();
 ea=A+8;
 A=i32[ea>>2];
 B=i32[ea+4>>2];
 C=a;
 !C&&TN();
 ea=C+8;
 C=i32[ea>>2];
 D=i32[ea+4>>2];
 E=32;
 C=lshr(C,D,E);
 D=tempReturn0;
 A=A^C;
 B=B^D;
 A=A;
 return A;
 
}
AOTMD["$G$tnWvIO_9"] = {"osr":[]};
$G$tnWvIO.classSymbols = ["java/lang/Long"];
// java/io/OutputStream extends java/lang/Object
// java/io/OutputStream.write.([BII)V ($G$sJMI9U_3)
function $G$sJMI9U_3(a,b,c,d) {
 var re;
 var e=0;
 var self=a;
 var A=0,B=0,C=0,D=0;
 var pc=0;
 if(O){
   var nt=$.ctx.nativeThread;
   var fp=nt.fp;
   var lp=fp-5;
   a=i32[lp+0],b=i32[lp+1],c=i32[lp+2],d=i32[lp+3],e=i32[lp+4];
   self=i32[fp+3]
   pc=nt.pc;
   nt.popFrame(O);
   nt.pushMarkerFrame(1073741824);
   O=null;
 }
 var label=0;
 // Entry Dispatch Block
 if (pc===0) {
 label = 1;
 } else if (!(pc===56)) {
 }
 do {
 if (label == 1) {
 A=b;
 if (!(A!==0)) {
 A=AO(CI[$C1]);
 B=A;
 !B&&TN();
 re=(LM[$M1_0]||GLM($M1_0))(B);
 !A&&TN();
 throw GH(A);
 }
 A=c;
 if (!(A<0)) {
 A=c;
 B=b;
 !B&&TN();
 B=i32[B+4>>2];
 if (!(A>B)) {
 A=d;
 if (!(A<0)) {
 A=c;
 B=d;
 A=A+B|0;
 B=b;
 !B&&TN();
 B=i32[B+4>>2];
 if (!(A>B)) {
 A=c;
 B=d;
 A=A+B|0;
 if (A>=0) {
 A=d;
 if (A!==0) {
 A=0;
 e=A;
 break;
 } else {
 return;
 }
 }
 }
 }
 }
 }
 A=AO(CI[$C2]);
 B=A;
 !B&&TN();
 re=(LM[$M2_0]||GLM($M2_0))(B);
 !A&&TN();
 throw GH(A);
 }
 } while(0);
 while(1) {
 A=e;
 B=d;
 if (A>=B) {
 break;
 }
 A=a;
 B=b;
 C=c;
 D=e;
 C=C+D|0;
 !B&&TN();
 if((C>>>0)>=(i32[B+4>>2]>>>0))TI(C);
 B=i8[B+8+C|0];
 !A&&TN();
 re=(FT[(i32[(A|0)>>2]<<6)+9]||GLVM(i32[(A|0)>>2],9))(A,B);
 if(U){$.B($M0_3,69,null,a,b,c,d,e);return;}
 e=e+1|0;
 }
 return;
 
}
AOTMD["$G$sJMI9U_3"] = {"osr":[56]};
$G$sJMI9U.classSymbols = ["java/io/OutputStream", "java/lang/NullPointerException", "java/lang/IndexOutOfBoundsException"];

/*
 */
  console.log("Loaded java/classes.jar in " + (performance.now() - start).toFixed(2) + " ms.");
