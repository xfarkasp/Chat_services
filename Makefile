.PHONY: deploy install-minio create-tls-secret init-sql apply-db-job clean-db-job init-db

NAMESPACE := chat-services
SQL_FILE := ./sql/init.sql
POSTGRES_MANIFEST := ./yamls/postgres.yaml
DB_JOB_FILE := ./yamls/db-init-job.yaml
CONFIGMAP_NAME := db-init-sql

# Create ConfigMap from init.sql
init-sql:
	@echo "Creating ConfigMap with init.sql..."
	kubectl create configmap $(CONFIGMAP_NAME) \
		--from-file=init.sql=$(SQL_FILE) \
		-n $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -

# Apply the init job
apply-db-job:
	@echo "Applying PostgreSQL initialization Job..."
	kubectl apply -f $(DB_JOB_FILE) -n $(NAMESPACE)

# delete the Job after it runs
clean-db-job:
	@echo "Deleting init Job (optional)..."
	kubectl delete job db-init -n $(NAMESPACE) || true

# Full flow: setup DB and schema
init-db: init-sql apply-db-job

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
