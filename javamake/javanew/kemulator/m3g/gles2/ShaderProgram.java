package kemulator.m3g.gles2;

import java.io.InputStream;
import java.io.InputStreamReader;

import pl.zb3.freej2me.bridge.gles2.GLES2;

public class ShaderProgram {
    public static final String SHADER_BASE_PATH = "m3g_shaders/";

    private String name;
    private boolean loaded;
    private Object programHandle;

    public ShaderProgram(String name) {
        this.name = name;
    }

	private static String getShaderSource(String fileName) {
		// CLDC doesn't support ClassLoader, use Class.getResourceAsStream() instead
		Class clazz;
		try {
			clazz = Class.forName("kemulator.m3g.gles2.Emulator3D");
		} catch (ClassNotFoundException e) {
			throw new IllegalStateException("Emulator3D class not found");
		}
		InputStream inputStream = clazz.getResourceAsStream(fileName);

		if (inputStream == null) {
			throw new IllegalArgumentException("File not found in the JAR: " + fileName);
		}

        StringBuilder shaderSource = new StringBuilder();
		InputStreamReader reader = new InputStreamReader(inputStream);

		try {
			int ch;
			while ((ch = reader.read()) != -1) {
				shaderSource.append((char)ch);
			}
			reader.close();
		} catch (Exception e) {
			try {
				reader.close();
			} catch (Exception e2) {}
			throw new RuntimeException("Error while reading the file: " + fileName);
		}

        return shaderSource.toString();
    }

    private void load() {
        try {
            String vertexSource = getShaderSource(SHADER_BASE_PATH+name+"_vertex.glsl");
            String fragmentSource = getShaderSource(SHADER_BASE_PATH+name+"_fragment.glsl");
            
            System.out.println("[ShaderProgram] Loading shader: " + name);
            System.out.println("[ShaderProgram] Vertex shader length: " + (vertexSource != null ? vertexSource.length() : 0));
            System.out.println("[ShaderProgram] Fragment shader length: " + (fragmentSource != null ? fragmentSource.length() : 0));
            
            programHandle = GLES2.createProgram(vertexSource, fragmentSource);
            
            // Check if programHandle is null (createProgram throws exception on failure, so null check should be sufficient)
            if (programHandle == null) {
                System.err.println("[ShaderProgram] ERROR: Failed to create shader program for: " + name + " (programHandle is null)");
                throw new RuntimeException("Shader program creation failed for: " + name);
            }
            
            System.out.println("[ShaderProgram] Shader program created successfully: " + name);
            loaded = true;

            onLoad();
        } catch (Exception e) {
            System.err.println("[ShaderProgram] ERROR loading shader " + name + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public void use() {
        if (!loaded) {
            load();
        }
        GLES2.useProgram(programHandle);
    }

    public void delete() {
        if (loaded) {
            GLES2.deleteProgram(programHandle);
        }
    }

    public void onLoad() {

    }

    public Object u(String name) {
        return GLES2.getUniformLocation(programHandle, name);
    }

    public Object u(String name, int idx) {
        return GLES2.getUniformLocation(programHandle, name+"["+idx+"]");
    }

    public int a(String name) {
        return GLES2.getAttribLocation(programHandle, name);
    }

    public int a(String name, int idx) {
        return GLES2.getAttribLocation(programHandle, name+"["+idx+"]");
    }
}
