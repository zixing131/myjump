package javax.microedition.m3g;

import kemulator.m3g.impl.MeshMorph;

public class MorphingMesh extends Mesh {
	private VertexBuffer[] targets;
	private VertexBuffer resultVb;
	private float[] weights;
	public float m_baseWeight;

	public MorphingMesh(VertexBuffer base, VertexBuffer[] targets, IndexBuffer submesh, Appearance appearance) {
		super(base, submesh, appearance);
		if (targets == null) {
			throw new NullPointerException();
		} else {
			this.targets = new VertexBuffer[targets.length];

			for (int var5 = targets.length - 1; var5 >= 0; --var5) {
				if (targets[var5] == null) {
					throw new NullPointerException();
				}

				if (targets[var5].getVertexCount() == 0) {
					throw new IllegalArgumentException("targets is empty");
				}

				this.targets[var5] = targets[var5];
				this.addReference(this.targets[var5]);
			}

			this.weights = new float[this.targets.length];
			this.m_baseWeight = 1.0F;

			this.resultVb = (VertexBuffer)base.duplicate();
		}
	}

	public MorphingMesh(VertexBuffer base, VertexBuffer[] targets, IndexBuffer[] submeshes, Appearance[] appearances) {
		super(base, submeshes, appearances);
		this.targets = new VertexBuffer[targets.length];

		for (int var5 = targets.length - 1; var5 >= 0; --var5) {
			if (targets[var5] == null) {
				throw new NullPointerException();
			}

			if (targets[var5].getVertexCount() == 0) {
				throw new IllegalArgumentException("targets is empty");
			}

			this.targets[var5] = targets[var5];
			this.addReference(this.targets[var5]);
		}

		this.weights = new float[this.targets.length];
		this.m_baseWeight = 1.0F;
		this.resultVb = (VertexBuffer)base.duplicate();
	}

	protected Object3D duplicateObject() {
		MorphingMesh var1;
		(var1 = (MorphingMesh) super.duplicateObject()).weights = (float[]) this.weights.clone();
		var1.targets = (VertexBuffer[]) this.targets.clone();
		return var1;
	}

	public VertexBuffer getMorphTarget(int var1) {
		if (var1 >= 0 && var1 < this.targets.length) {
			return this.targets[var1];
		} else {
			throw new IndexOutOfBoundsException();
		}
	}

	public int getMorphTargetCount() {
		return this.targets.length;
	}

	public void setWeights(float[] var1) {
		if (var1 == null) {
			throw new NullPointerException();
		} else if (var1.length < this.weights.length) {
			throw new IllegalArgumentException();
		} else {
			this.m_baseWeight = 1.0F;

			for (int var2 = 0; var2 < this.weights.length; ++var2) {
				this.weights[var2] = var1[var2];
				this.m_baseWeight -= var1[var2];
			}

		}
	}

	public void getWeights(float[] var1) {
		if (var1 == null) {
			throw new NullPointerException();
		} else if (var1.length < this.weights.length) {
			throw new IllegalArgumentException();
		} else {
			System.arraycopy(this.weights, 0, var1, 0, this.weights.length);
		}
	}

	protected void updateProperty(int property, float[] values) {
		switch (property) {
			case 266:
				this.m_baseWeight = 1.0F;

				for (int var3 = 0; var3 < this.weights.length; ++var3) {
					if (var3 < values.length) {
						this.weights[var3] = values[var3];
						this.m_baseWeight -= values[var3];
					} else {
						this.weights[var3] = 0.0F;
					}
				}

				return;
			default:
				super.updateProperty(property, values);
		}
	}

	protected boolean rayIntersect(int scope, float[] ray, RayIntersection ri, Transform transform) {
		MeshMorph.getInstance().getMorphedVertexBuffer(this);
		MeshMorph.getInstance().clearCache();
		return super.rayIntersect(scope, ray, ri, transform, MeshMorph.getInstance().morphed);
	}

	public float getBaseWeight() {
		return m_baseWeight;
	}

	public VertexBuffer getResultVb() {
		return resultVb;
	}
}
