import javax.microedition.lcdui.*;
import javax.microedition.lcdui.game.*;
import java.io.*;

// taken from Doppio
class Threading extends Thread {
  public Threading(String name) {
    super(name);
  }
  public void run() {
    System.out.println("hello from "+Thread.currentThread().getName());
  }
  public static void main(String[] args) throws java.lang.InterruptedException {
    Thread.currentThread().interrupt();

    Threading t = new Threading("hello-thread");
    t.run();
    t.start();
    t.join();
    System.out.println("joined in "+Thread.currentThread().getName());
    Q q = new Q();
    new Producer(q);
    new Consumer(q);
  }
}

// A correct implementation of a producer and consumer.
class Q {
  int n;
  boolean valueSet = false;
  synchronized int get() {
    if(!valueSet)
      try {
        wait();
      } catch(InterruptedException e) {
        System.out.println("InterruptedException caught");
      }
    System.out.println("Got: " + n);
    valueSet = false;
    notify();
    return n;
  }
  synchronized void put(int n) {
    if(valueSet)
      try {
        wait();
      } catch(InterruptedException e) {
        System.out.println("InterruptedException caught");
      }
    this.n = n;
    valueSet = true;
    System.out.println("Put: " + n);
    notify();
  }
}

class Producer implements Runnable {
  Q q;
  Producer(Q q) {
    this.q = q;
    new Thread(this, "Producer").start();
  }
  public void run() {
    for (int i=0; i<5; ++i) {
      q.put(i);
    }
  }
}

class Consumer implements Runnable {
  Q q;
  Consumer(Q q) {
    this.q = q;
    new Thread(this, "Consumer").start();
  }
  public void run() {
    while(true) {
      if (q.get() == 4) break;
    }
  }
}

public class Test extends TestMidlet {
	
	public void startApp() {
    try {
      Threading.main(null);
    } catch (Exception e) {
      check(false);
    }
		finish();
	}
	
}
