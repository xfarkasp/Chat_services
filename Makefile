.PHONY: deploy

NAMESPACE=chat-services

install-minio:
	@echo "Adding MinIO Helm repo..."
	helm repo add minio https://charts.min.io/ || true
	helm repo update

	@echo "Installing MinIO via Helm..."
	helm upgrade --install minio minio/minio \
		--namespace $(NAMESPACE) \
		--set mode=standalone \
		--set auth.rootUser=minio \
		--set auth.rootPassword=minio123 \
		--set replicas=1 \
		--set ingress.enabled=true \
		--set ingress.hosts[0]=minio-services.minikube \
		--set ingress.tls[0].hosts[0]=minio-services.minikube \
		--set ingress.tls[0].secretName=minio-services-tls \
		--set resources.limits.memory=256Mi \
		--set resources.requests.memory=128Mi \
		--set env[0].name=MINIO_SERVER_URL \
		--set env[0].value=https://minio.minikube \
		--set env[1].name=MINIO_BROWSER_REDIRECT_URL \
		--set env[1].value=https://minio.minikube

create-tls-secret:
	openssl req -x509 -nodes -days 365 \
		-newkey rsa:2048 \
		-keyout tls.key \
		-out tls.crt \
		-subj "/CN=minio-services.minikube"
	kubectl create secret tls minio-services-tls \
		--cert=tls.crt --key=tls.key \
		-n $(NAMESPACE)

deploy:
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -n $(NAMESPACE) -R -f yamls/
