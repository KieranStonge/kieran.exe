SHELL := /bin/zsh
PORT ?= 8080
HOST ?= 0.0.0.0

.PHONY: help run

help:
	@echo "Targets:"
	@echo "  make run [PORT=8080] [HOST=0.0.0.0]  - Run local static server"

run:
	@echo "Serving on http://localhost:$(PORT)"
	python3 -m http.server $(PORT) --bind $(HOST)
