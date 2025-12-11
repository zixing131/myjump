SRC_DIRS=gbkwriter freej2me cldc1.1.1 vm midp custom
JPP_DEFS=-ENABLE_JSR_205 -ENABLE_SSL -ENABLE_PUBLICKEYSTORE -ENABLE_JSR_211 -ENABLE_MULTIPLE_ISOLATES -RECORD -USE_FILE_CONNECTION -ENABLE_JSR_234
 


SRC_DIRS += jsr-256
JPP_DEFS += -ENABLE_JSR_256

SRC_DIRS += jsr-082

SRC_DIRS += jsr-179
JPP_DEFS += -ENABLE_JSR_179

# 3D support (M3G API)
SRC_DIRS += kemulator
SRC_DIRS += pl

SRCS=$(shell find $(SRC_DIRS) -name *.java)
JPP_SRCS=$(shell find $(SRC_DIRS) -name *.jpp)
JPP_DESTS=$(JPP_SRCS:.jpp=.java)
EXTRA=$(shell find . -name *.png) $(shell find . -name *.bin) $(shell find l10n -name *.json)

classes.jar: $(SRCS) $(JPP_DESTS) $(EXTRA)
	rm -rf build build-src
	mkdir build build-src
	$(foreach dir,$(SRC_DIRS),cp -a $(dir)/. build-src/;)
	find ./build-src -name *.java > build-srcs.txt
	javac -cp build-src -g:none -source 8 -target 8 -bootclasspath "" -extdirs "" -d ./build @build-srcs.txt 2>&1
	rm -rf build-src
	# TODO: Re-enable Soot optimizations once tests with baseline JIT enabled
	#       for all methods pass.
	#java -jar ../build_tools/soot-trunk.jar -j2me -process-dir build -no-output-source-file-attribute -no-output-inner-classes-attribute -force-overwrite -include-all 2>&1 > /dev/null
	#cp -a sootOutput/. build/
	cd build && jar cf0 ../classes.jar *
	jar uf0 classes.jar $(EXTRA)

tools/Jpp.class: tools/Jpp.java
	javac $^

# Preprocess all .jpp files to generate corresponding .java files.
$(JPP_DESTS): tools/Jpp.class $(JPP_SRCS)
	$(foreach file,$(JPP_SRCS), java -classpath tools Jpp $(file) $(JPP_DEFS) -o $(file:.jpp=.java);)

clean:
	rm -f `find . -name "*.jar" -or -name "*~"` $(JPP_DESTS)
	rm -f build-srcs.txt
	rm -rf sootOutput build build-src
