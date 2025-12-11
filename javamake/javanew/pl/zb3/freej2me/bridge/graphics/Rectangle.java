package pl.zb3.freej2me.bridge.graphics;

public class Rectangle {
    public int x;
    public int y;
    public int width;
    public int height;

    public Rectangle(int x, int y, int width, int height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public boolean intersects(Rectangle r) {
        int tw = this.width;
        int th = this.height;
        int rw = r.width;
        int rh = r.height;
        if (rw > 0 && rh > 0 && tw > 0 && th > 0) {
            int tx = this.x;
            int ty = this.y;
            int rx = r.x;
            int ry = r.y;
            rw += rx;
            rh += ry;
            tw += tx;
            th += ty;
            return (rw < rx || rw > tx) && (rh < ry || rh > ty) && (tw < tx || tw > rx) && (th < ty || th > ry);
        } else {
            return false;
        }
    }

    public void set(int x, int y, int width, int height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public void intersect(int x, int y, int width, int height) {
        // this is set to intersection of this and r

        int tx1 = this.x;
        int ty1 = this.y;
        int tx2 = tx1 + this.width;
        int ty2 = ty1 + this.height;

        int rx1 = x;
        int ry1 = y;
        int rx2 = rx1 + width;
        int ry2 = ry1 + height;

        if (tx1 < rx1) tx1 = rx1;
        if (ty1 < ry1) ty1 = ry1;
        if (tx2 > rx2) tx2 = rx2;
        if (ty2 > ry2) ty2 = ry2;

        this.x = tx1;
        this.y = ty1;
        this.width = Math.max(0, tx2 - tx1);
        this.height = Math.max(0, ty2 - ty1);
    }


    public void intersect(Rectangle r) {
        intersect(r.x, r.y, r.width, r.height);
    }

}
