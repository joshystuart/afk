IMAGES = node python go rust dotnet java

.PHONY: all base $(IMAGES) clean help

all: base $(IMAGES)

base:
	docker build -t awayfromklaude/afk-base:latest -f base/Dockerfile .

$(IMAGES): base
	docker build -t afk-$@:latest -f $@/Dockerfile .

clean:
	-docker rmi $(addprefix afk-,$(addsuffix :latest,$(IMAGES))) awayfromklaude/afk-base:latest 2>/dev/null

help:
	@echo "Usage:"
	@echo "  make all       Build all images (base + language)"
	@echo "  make base      Build the base image only"
	@echo "  make node      Build afk-node image"
	@echo "  make python    Build afk-python image"
	@echo "  make go        Build afk-go image"
	@echo "  make rust      Build afk-rust image"
	@echo "  make dotnet    Build afk-dotnet image"
	@echo "  make java      Build afk-java image"
	@echo "  make clean     Remove all afk images"
