GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
BINARY_NAME=../eckManager
BINARY_UNIX=$(BINARY_NAME)_unix

ifndef CIRCLE_BRANCH
override CIRCLE_BRANCH = latest
endif

all: clean test build

dep:
	go get github.com/markbates/pkger/cmd/pkger

test:
	cd server && $(GOTEST) -v ./...

build: build-ui build-server

build-ui:
	cd eckui && yarn install
	cd eckui && yarn run build
	mkdir -p server/ui
	cp -r eckui/build/* server/ui/.

build-server:
	cd server && pkger
	cd server && $(GOBUILD) -o $(BINARY_NAME) -v
	cd server && rm -f pkged.go
	
clean: 
	cd server && $(GOCLEAN)
	cd server && rm -f $(BINARY_NAME)
	cd server && rm -f $(BINARY_UNIX)
	cd server && rm -f pkged.go
	rm -rf *.tar.gz
run:
	cd server && $(GOBUILD) -o $(BINARY_NAME) -v ./...
	./$(BINARY_NAME)

package:
	tar -czvf gogallery-linux-amd64.tgz gogallery config_sample.yml
# Cross compilation
build-linux:
		cd server && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_UNIX) -v
docker:
		docker build . -t robrotheram/gogallery:$(CIRCLE_BRANCH)
		docker build . -t robrotheram/gogallery:latest
docker-publish:
		docker push robrotheram/gogallery:$(CIRCLE_BRANCH)
		docker push robrotheram/gogallery:latest
