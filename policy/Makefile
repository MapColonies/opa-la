.PHONY: lint test check all

all: lint check test

lint:
	./regal lint .

check:
	./opa check . --strict

test:
	./opa test . -v

init:
	curl -L -o regal https://github.com/open-policy-agent/regal/releases/download/v0.42.0/regal_Linux_x86_64
	chmod 755 ./regal
	curl -L -o opa https://openpolicyagent.org/downloads/v1.18.2/opa_linux_amd64_static
	chmod 755 ./opa

