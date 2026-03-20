IMAGES = node python go rust dotnet java

.PHONY: all base $(IMAGES) clean help

all: base $(IMAGES)

base:
	docker build -t awayfromklaude/afk-base:latest -f base/Dockerfile .

$(IMAGES): base
	docker build -t afk-$@:latest -t awayfromklaude/afk-$@:latest -f $@/Dockerfile .

clean:
	-docker rmi $(addprefix afk-,$(addsuffix :latest,$(IMAGES))) $(addprefix awayfromklaude/afk-,$(addsuffix :latest,$(IMAGES))) awayfromklaude/afk-base:latest 2>/dev/null

help:
	@echo "Usage:"
	@echo "  make all       Build all images (base + language)"
	@echo "  make base      Build the base image only"
	@echo "  make node      Build afk-node + awayfromklaude/afk-node:latest"
	@echo "  make python    Build afk-python + awayfromklaude/afk-python:latest"
	@echo "  make go        Build afk-go + awayfromklaude/afk-go:latest"
	@echo "  make rust      Build afk-rust + awayfromklaude/afk-rust:latest"
	@echo "  make dotnet    Build afk-dotnet + awayfromklaude/afk-dotnet:latest"
	@echo "  make java      Build afk-java + awayfromklaude/afk-java:latest"
	@echo "  make clean     Remove all afk images (local + awayfromklaude/ tags)"
