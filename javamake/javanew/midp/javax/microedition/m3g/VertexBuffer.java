package javax.microedition.m3g;

import kemulator.m3g.gles2.BUtils;
import kemulator.m3g.gles2.Emulator3D;
import kemulator.m3g.gles2.MeshProgram;
import kemulator.m3g.utils.G3DUtils;
import kemulator.m3g.utils.Vector4f;
import pl.zb3.freej2me.bridge.gles2.BufferHelper;
import pl.zb3.freej2me.bridge.gles2.GLES2;

public class VertexBuffer extends Object3D {

	private int vertexCount = 0;
	private VertexArray positions = null;
	private VertexArray normals = null;
	private VertexArray[] uvms;
	private VertexArray colors = null;

	private int defaultColor = -1;

	private float[] posScaleBias;
	private float[][] uvScaleBias;

	private int arraysCount = 0;

	// upload part
	private Object bufferHandle = null;
	private Object vaoHandle = null;
	private int bufferSize = 0;
	private short[] bufferBuffer;
	private boolean invalidated = true;
	private boolean uploadedFlat = false;
	private IndexBuffer uploadedIndexBuffer = null;

	public VertexBuffer() {
		this.uvms = new VertexArray[Emulator3D.NumTextureUnits];
		this.posScaleBias = new float[]{1, 0, 0, 0};
		this.uvScaleBias = new float[Emulator3D.NumTextureUnits][4];
	}

	protected Object3D duplicateObject() {
		VertexBuffer clone = (VertexBuffer) super.duplicateObject();
		clone.uvms = (VertexArray[]) uvms.clone();
		clone.posScaleBias = (float[]) posScaleBias.clone();
		clone.uvScaleBias = new float[Emulator3D.NumTextureUnits][4];
		clone.vaoHandle = null;
		clone.bufferHandle = null;
		clone.bufferSize = 0;
		clone.uploadedIndexBuffer = null;
		clone.invalidated = true;

		for (int i = 0; i < Emulator3D.NumTextureUnits; ++i) {
			clone.uvScaleBias[i] = (float[]) uvScaleBias[i].clone();
		}

		return clone;
	}

	public int getVertexCount() {
		return vertexCount;
	}

	public void setPositions(VertexArray newPoses, float scale, float[] bias) {
		if (newPoses != null && newPoses.getComponentCount() != 3) {
			throw new IllegalArgumentException();
		} else if (newPoses != null && bias != null && bias.length < 3) {
			throw new IllegalArgumentException();
		} else if (newPoses != null && vertexCount != 0 && newPoses.getVertexCount() != vertexCount) {
			throw new IllegalArgumentException();
		} else {
			removeReference(positions);

			if (newPoses != null) {
				if (positions == null) arraysCount++;

				vertexCount = newPoses.getVertexCount();
				positions = newPoses;

				posScaleBias[0] = scale;
				if (bias != null) {
					System.arraycopy(bias, 0, posScaleBias, 1, 3);
				} else {
					posScaleBias[1] = 0.0F;
					posScaleBias[2] = 0.0F;
					posScaleBias[3] = 0.0F;
				}
			} else if (positions != null) {
				positions.uploadedFor = null;
				positions = null;
				arraysCount--;
				vertexCount = arraysCount > 0 ? vertexCount : 0;
			}

			addReference(positions);
		}
	}

	public void setTexCoords(int index, VertexArray newUvm, float scale, float[] bias) {
		if (newUvm != null && newUvm.getComponentCount() != 2 && newUvm.getComponentCount() != 3) {
			throw new IllegalArgumentException();
		} else if (newUvm != null && vertexCount != 0 && newUvm.getVertexCount() != vertexCount) {
			throw new IllegalArgumentException();
		} else if (newUvm != null && bias != null && bias.length < newUvm.getComponentCount()) {
			throw new IllegalArgumentException();
		} else if (index >= 0 && index < Emulator3D.NumTextureUnits) {
			removeReference(uvms[index]);

			if (newUvm != null) {
				if (uvms[index] == null) arraysCount++;

				vertexCount = newUvm.getVertexCount();
				uvms[index] = newUvm;

				uvScaleBias[index][0] = scale;
				uvScaleBias[index][1] = 0.0F;
				uvScaleBias[index][2] = 0.0F;
				uvScaleBias[index][3] = 0.0F;
				if (bias != null) {
					System.arraycopy(bias, 0, uvScaleBias[index], 1, newUvm.getComponentCount());
				}
			} else if (uvms[index] != null) {
				uvms[index].uploadedFor = null;
				uvms[index] = null;
				arraysCount--;
				vertexCount = arraysCount > 0 ? vertexCount : 0;
			}

			addReference(uvms[index]);
		} else {
			throw new IndexOutOfBoundsException();
		}
	}

	public void setNormals(VertexArray newNorms) {
		if (newNorms != null && newNorms.getComponentCount() != 3) {
			throw new IllegalArgumentException();
		} else if (newNorms != null && vertexCount != 0 && newNorms.getVertexCount() != vertexCount) {
			throw new IllegalArgumentException();
		} else {
			removeReference(normals);

			if (newNorms != null) {
				if (normals == null) arraysCount++;

				vertexCount = newNorms.getVertexCount();
				normals = newNorms;
			} else if (normals != null) {
				normals.uploadedFor = null;
				normals = null;
				arraysCount--;
				vertexCount = arraysCount > 0 ? vertexCount : 0;
			}

			addReference(normals);
		}
	}

	public void setColors(VertexArray newCols) {
		if (newCols != null && newCols.getComponentType() != 1) {
			throw new IllegalArgumentException();
		} else if (newCols != null && newCols.getComponentCount() != 3 && newCols.getComponentCount() != 4) {
			throw new IllegalArgumentException();
		} else if (newCols != null && vertexCount != 0 && newCols.getVertexCount() != vertexCount) {
			throw new IllegalArgumentException();
		} else {
			removeReference(colors);

			if (newCols != null) {
				if (colors == null) arraysCount++;

				vertexCount = newCols.getVertexCount();
				colors = newCols;
			} else if (colors != null) {
				colors.uploadedFor = null;
				colors = null;
				arraysCount--;
				vertexCount = arraysCount > 0 ? vertexCount : 0;
			}

			addReference(colors);
		}
	}

	public VertexArray getPositions(float[] scaleBias) {
		if (scaleBias != null && scaleBias.length < 4) {
			throw new IllegalArgumentException();
		} else {
			if (positions != null && scaleBias != null) {
				System.arraycopy(posScaleBias, 0, scaleBias, 0, 4);
			}

			return positions;
		}
	}

	public VertexArray getTexCoords(int index, float[] scaleBias) {
		if (index >= 0 && index < Emulator3D.NumTextureUnits) {

			if (uvms[index] != null && scaleBias != null) {
				if (scaleBias.length < uvms[index].getComponentCount() + 1) {
					throw new IllegalArgumentException();
				}

				System.arraycopy(uvScaleBias[index], 0, scaleBias, 0, uvms[index].getComponentCount() + 1);
			}

			return uvms[index];
		} else {
			throw new IndexOutOfBoundsException();
		}
	}

	public VertexArray getNormals() {
		return normals;
	}

	public VertexArray getColors() {
		return colors;
	}

	public void setDefaultColor(int col) {
		defaultColor = col;
		if (colors == null) {
			invalidated = true;
		}
	}

	public int getDefaultColor() {
		return defaultColor;
	}

	protected void updateProperty(int property, float[] value) {
		switch (property) {
			case AnimationTrack.ALPHA:
				defaultColor &= 0xffffff;
				defaultColor |= G3DUtils.getIntColor(value) & 0xff000000;
				if (colors == null) {
					invalidated = true;
				}
				return;
			case AnimationTrack.COLOR:
				defaultColor &= 0xff000000;
				defaultColor |= G3DUtils.getIntColor(value) & 0xffffff;
				if (colors == null) {
					invalidated = true;
				}
				return;
			default:
				super.updateProperty(property, value);
		}
	}

	protected boolean getNormalVertex(int vertexIndex, Vector4f vec) {
		if (normals == null) {
			return false;
		} else {
			float nx, ny, nz;

			if (normals.getComponentType() == 1) {
				byte[] tmpVec = new byte[3];
				normals.get(vertexIndex, 1, tmpVec);

				nx = tmpVec[0];
				ny = tmpVec[1];
				nz = tmpVec[2];
			} else {
				short[] tmpVec = new short[3];
				normals.get(vertexIndex, 1, tmpVec);

				nx = tmpVec[0];
				ny = tmpVec[1];
				nz = tmpVec[2];
			}

			vec.set(nx, ny, nz, 1.0F);
			return true;
		}
	}

	protected void getVertex(int vertexIndex, Vector4f vec) {
		float x, y, z;

		if (this.positions.getComponentType() == 1) {
			byte[] tmpVec = new byte[3];
			positions.get(vertexIndex, 1, tmpVec);

			x = tmpVec[0];
			y = tmpVec[1];
			z = tmpVec[2];
		} else {
			short[] tmpVec = new short[3];
			positions.get(vertexIndex, 1, tmpVec);

			x = tmpVec[0];
			y = tmpVec[1];
			z = tmpVec[2];
		}

		x *= posScaleBias[0];
		y *= posScaleBias[0];
		z *= posScaleBias[0];

		x += posScaleBias[1];
		y += posScaleBias[2];
		z += posScaleBias[3];

		vec.set(x, y, z, 1.0F);
	}

	protected boolean getTexVertex(int vertexIndex, int texSlot, Vector4f vec) {
		if (uvms[texSlot] == null) {
			return false;
		} else {
			float x, y, z;

			int componentCount = this.uvms[texSlot].getComponentCount();

			if (uvms[texSlot].getComponentType() == 1) {
				byte[] tmpVec = new byte[componentCount];
				uvms[texSlot].get(vertexIndex, 1, tmpVec);

				x = tmpVec[0];
				y = tmpVec[1];
				z = componentCount == 3 ? (float) tmpVec[2] : 0.0F;
			} else {
				short[] tmpVec = new short[componentCount];
				uvms[texSlot].get(vertexIndex, 1, tmpVec);

				x = tmpVec[0];
				y = tmpVec[1];
				z = componentCount == 3 ? (float) tmpVec[2] : 0.0F;
			}

			x *= uvScaleBias[texSlot][0];
			y *= uvScaleBias[texSlot][0];
			z *= uvScaleBias[texSlot][0];

			x += uvScaleBias[texSlot][1];
			y += uvScaleBias[texSlot][2];
			z += uvScaleBias[texSlot][3];

			vec.set(x, y, z, 1.0F);
			return true;
		}
	}

	private void uploadVertexArray(VertexArray arr, IndexBuffer ib, boolean flatShade, boolean substitute, int offset, int stride, boolean normalized, boolean unsigned) {
		if (arr == null) {
			return;
		}

		if (flatShade) {
			arr.explodeFor((TriangleStripArray)ib, substitute);
		}

		byte[] vBytes = flatShade ? arr.getExplodedByteValues() : arr.getByteValues();
		short[] vShorts = flatShade ? arr.getExplodedShortValues() : arr.getShortValues();
		boolean vUseBytes = arr.getComponentType() == 1;
		int vc = vUseBytes ? vBytes.length : vShorts.length;
		int vcc = arr.componentCount;
		vc /= vcc;

		for (int t=0; t<vc; t++) {
			for (int c=0; c<vcc; c++) {
				short tmp = 0;
				if (vUseBytes) {
					tmp = normalized ? normalizeByteToShort(vBytes[t*vcc+c], !unsigned) : vBytes[t*vcc+c];
				} else {
					tmp = vShorts[t*vcc+c];
				}
				bufferBuffer[t*stride+offset+c] = tmp;
			}
		}

		arr.uploadedFor = this;
	}

    public static short normalizeByteToShort(byte b, boolean signed) {
		if (signed) {
			if (b == -128) {
				return (short) 0x8000;
			}
			// CLDC doesn't support Math.round(), use manual rounding
			double val = b * (32767.0 / 127.0);
			return (short) (val < 0 ? (val - 0.5) : (val + 0.5));
		} else {
			int unsigned = b & 0xff;
        	return (short) (unsigned * 257);
		}

    }

	public void uploadToGL(IndexBuffer ib, boolean flatShade, boolean uploadNormals, MeshProgram mp, BufferHelper bufferHelper) {
		if (bufferHandle == null) {
			bufferHandle = GLES2.createBuffer();
		}

		// positions, normals, tex0, tex1, colors, lightpos
		int cc = 6;

		// explodeFor is only called by us.. so it affects uploadedFor
		// therefore we don't need to check that

		if (invalidated || uploadedFlat != flatShade ||
			positions.uploadedFor != this || (uploadNormals && normals != null && normals.uploadedFor != this) ||
			(uvms[0] != null && uvms[0].uploadedFor != this) ||
			(uvms[1] != null && uvms[1].uploadedFor != this) ||
			(colors != null && colors.uploadedFor != this)) {
			// if we're here it means we need to update our buffer
			GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, bufferHandle);

			if (positions.uploadedFor != this && flatShade) {
				positions.explodeFor((TriangleStripArray)ib, false);
			}

			int numVertices = flatShade ? positions.getExplodedVertexCount() : vertexCount;

			int neededSize = cc * numVertices * 2 * 4; // everything will be short, 4 elements

			if (bufferSize < neededSize) {
				int newSize = neededSize * 4 / 3;
				GLES2.bufferData(GLES2.Constants.GL_ARRAY_BUFFER, newSize, GLES2.Constants.GL_DYNAMIC_DRAW);
				bufferSize = newSize;
				bufferBuffer = new short[newSize/2];
			}

			if (positions.uploadedFor != this) {
				uploadVertexArray(positions, ib, flatShade, false, 0, 4*cc, false, false);

				if (flatShade) {
					// this is like "re-exploding" position but with substitute=true
					short[] posesArrFlat;

					if (positions.getComponentType() == 1) {
						posesArrFlat = BUtils.getVertexBufferFlatLight(positions.getExplodedByteValues());
					} else {
						posesArrFlat = BUtils.getVertexBufferFlatLight(positions.getExplodedShortValues());
					}

					// posesArrFlat has numVertices * 3 elements (3 components per vertex)
					// Copy to vPosLight position (offset 5 in each vertex block) for each vertex
					for (int v = 0; v < numVertices; v++) {
						// vPosLight is at offset 5 in each vertex's 6-attribute block
						// Each attribute has 4 components
						int destOffset = v * 4 * cc + 4 * 5;  // = v * 24 + 20
						bufferBuffer[destOffset + 0] = posesArrFlat[v * 3 + 0];
						bufferBuffer[destOffset + 1] = posesArrFlat[v * 3 + 1];
						bufferBuffer[destOffset + 2] = posesArrFlat[v * 3 + 2];
					}
				}
			}

			if (uploadNormals && normals != null && normals.uploadedFor != this) {
				uploadVertexArray(normals, ib, flatShade, true, 4*1, 4*cc, true, false);
			}

			if (uvms[0] != null && uvms[0].uploadedFor != this) {
				uploadVertexArray(uvms[0], ib, flatShade, false, 4*2, 4*cc, false, false);
			}

			if (uvms[1] != null && uvms[1].uploadedFor != this) {
				uploadVertexArray(uvms[1], ib, flatShade, false, 4*3, 4*cc, false, false);
			}

			if (colors != null && colors.uploadedFor != this) {
				uploadVertexArray(colors, ib, flatShade, true, 4*4, 4*cc, true, true);
				if (colors.getComponentCount() == 3) {
					for (int t=0; t<numVertices; t++) {
						bufferBuffer[4*(t*cc+4)+3] = -1; // full alpha
					}
				}
			} else if (colors == null && invalidated) {
				for (int t=0; t<numVertices; t++) {
					bufferBuffer[4*(t*cc+4)+0] = normalizeByteToShort((byte)(defaultColor >> 16 & 255), false);
					bufferBuffer[4*(t*cc+4)+1] = normalizeByteToShort((byte)(defaultColor >> 8 & 255), false);
					bufferBuffer[4*(t*cc+4)+2] = normalizeByteToShort((byte)(defaultColor & 255), false);
					bufferBuffer[4*(t*cc+4)+3] = normalizeByteToShort((byte)(defaultColor >> 24 & 255), false);
				}
			}


			GLES2.bufferSubData(GLES2.Constants.GL_ARRAY_BUFFER, 0, neededSize, bufferBuffer);

			uploadedFlat = flatShade;
			invalidated = false;
		}

		if (vaoHandle == null) {
			vaoHandle = GLES2.createVertexArray();
			GLES2.bindVertexArray(vaoHandle);

			GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, bufferHandle);


			int stride = 4*cc*2;

			// Only enable/bind attributes that exist in the shader (index >= 0)
			if (mp.aVColor >= 0) {
				GLES2.enableVertexAttribArray(mp.aVColor);
				GLES2.vertexAttribPointer(mp.aVColor, 4, GLES2.Constants.GL_UNSIGNED_SHORT, true, stride, 4*2*4);
			}

			if (mp.aVNormal >= 0) {
				GLES2.enableVertexAttribArray(mp.aVNormal);
				GLES2.vertexAttribPointer(mp.aVNormal, 3, GLES2.Constants.GL_SHORT, true, stride, 4*2*1);
			}

			if (mp.aVPos >= 0) {
				GLES2.enableVertexAttribArray(mp.aVPos);
				GLES2.vertexAttribPointer(mp.aVPos, 3, GLES2.Constants.GL_SHORT, false, stride, 0);
			}

			if (mp.aVPosLight >= 0) {
				GLES2.enableVertexAttribArray(mp.aVPosLight);
				GLES2.vertexAttribPointer(mp.aVPosLight, 3, GLES2.Constants.GL_SHORT, false, stride, 4*2*5);
			}

			if (mp.aVCoords[0] >= 0) {
				GLES2.enableVertexAttribArray(mp.aVCoords[0]);
				GLES2.vertexAttribPointer(mp.aVCoords[0], 2, GLES2.Constants.GL_SHORT, false, stride, 4*2*(2+0));
			}

			if (mp.aVCoords[1] >= 0) {
				GLES2.enableVertexAttribArray(mp.aVCoords[1]);
				GLES2.vertexAttribPointer(mp.aVCoords[1], 2, GLES2.Constants.GL_SHORT, false, stride, 4*2*(2+1));
			}

		} else {
			GLES2.bindVertexArray(vaoHandle);
		}

		if (uploadedIndexBuffer != ib) {
			// this binds a proper buffer
			// we save this in our VAO

			TriangleStripArray triangleStripArray = (TriangleStripArray) ib;
			triangleStripArray.uploadToGL();
			uploadedIndexBuffer = ib;
		}
	}




}
