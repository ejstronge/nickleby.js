all: build

build:
	browserify export-ncbi.js >debug-ncbi.js
	browserify nickleby.js >index.js

clean:
	@rm debug-ncbi.js index.js
