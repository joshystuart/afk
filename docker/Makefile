DOCKERHUB_NAMESPACE ?= awayfromklaude
TAG ?= latest

IMAGES = node python go rust dotnet java

.PHONY: all base $(IMAGES) clean help push

all: base $(IMAGES)

base:
	docker build -t $(DOCKERHUB_NAMESPACE)/afk-base:$(TAG) -f base/Dockerfile .

$(IMAGES): base
	docker build \
		--build-arg BASE_TAG=$(TAG) \
		-t $(DOCKERHUB_NAMESPACE)/afk-$@:$(TAG) \
		-f $@/Dockerfile .

push:
	docker push $(DOCKERHUB_NAMESPACE)/afk-base:$(TAG)
	@for img in $(IMAGES); do \
		docker push $(DOCKERHUB_NAMESPACE)/afk-$$img:$(TAG); \
	done

clean:
	-docker rmi \
		$(addprefix $(DOCKERHUB_NAMESPACE)/afk-,$(addsuffix :$(TAG),$(IMAGES))) \
		$(DOCKERHUB_NAMESPACE)/afk-base:$(TAG) \
		2>/dev/null

help:
	@echo "Variables (environment or make VAR=value):"
	@echo "  DOCKERHUB_NAMESPACE  default: awayfromklaude"
	@echo "  TAG                  default: latest (e.g. alpha for pre-releases)"
	@echo ""
	@echo "Targets:"
	@echo "  make all       Build base + all language images"
	@echo "  make base      Base image only"
	@echo "  make node      Build one language image (python, go, rust, dotnet, java)"
	@echo "  make push      Push all images for this NAMESPACE and TAG (after make all)"
	@echo "  make clean     Remove images for this NAMESPACE and TAG"
