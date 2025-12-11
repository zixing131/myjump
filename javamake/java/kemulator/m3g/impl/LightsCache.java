package kemulator.m3g.impl;

import java.util.Vector;
import javax.microedition.m3g.Group;
import javax.microedition.m3g.Light;
import javax.microedition.m3g.Node;
import javax.microedition.m3g.Transform;
import javax.microedition.m3g.World;

public final class LightsCache {
	public static final float[] LOCAL_ORIGIN = new float[]{0.0F, 0.0F, 0.0F, 1.0F};
	public static final float[] POSITIVE_Z_AXIS = new float[]{0.0F, 0.0F, 1.0F, 0.0F};
	public static final float[] NEGATIVE_Z_AXIS = new float[]{0.0F, 0.0F, -1.0F, 0.0F};
	public static Vector m_lights = new Vector();
	public static Vector m_lightsTransform = new Vector();

	public static void addLightsFromWorld(World world) {
		resetLights();
		addLightsFromGroup(world, world);
	}

	private static void addLightsFromGroup(World world, Group group) {
		Transform tmpMat = new Transform();

		for (int i = 0; i < group.getChildCount(); ++i) {
			Node child = group.getChild(i);

			if (child instanceof Light && child.getTransformTo(world, tmpMat)) {
				m_lights.addElement(child);
				m_lightsTransform.addElement(new Transform(tmpMat));
			} else if (child instanceof Group) {
				addLightsFromGroup(world, (Group) child);
			}
		}
	}

	public static int addLight(Light light, Transform transform) {
		if (light == null) {
			throw new NullPointerException();
		} else {
			m_lights.addElement(light);
			if (transform == null) {
				m_lightsTransform.addElement(new Transform());
			} else {
				m_lightsTransform.addElement(new Transform(transform));
			}

			return m_lights.size();
		}
	}

	public static void setLight(int index, Light light, Transform transform) {
		if (index >= 0 && index < getLightCount()) {
			m_lights.setElementAt(light, index);
			if (transform == null) {
				m_lightsTransform.setElementAt(new Transform(), index);
			} else {
				m_lightsTransform.setElementAt(new Transform(transform), index);
			}
		} else {
			throw new IndexOutOfBoundsException();
		}
	}

	public static void resetLights() {
		m_lights.removeAllElements();
		m_lightsTransform.removeAllElements();
	}

	public static int getLightCount() {
		return m_lights.size();
	}

	public static Light getLight(int index, Transform transform) {
		if (index >= 0 && index < getLightCount()) {
			if (transform != null) {
				if (m_lightsTransform.elementAt(index) == null) {
					transform.setIdentity();
				} else {
					transform.set((Transform) m_lightsTransform.elementAt(index));
				}
			}

			return (Light) m_lights.elementAt(index);
		} else {
			throw new IndexOutOfBoundsException();
		}
	}
}
