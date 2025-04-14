.PHONY: deploy

NAMESPACE=chat-services

deploy:
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -n $(NAMESPACE) -R -f yamls/
