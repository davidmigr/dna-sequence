#!/bin/bash

cd analyzer-service
docker build -t gusrochada/analyzer-service:latest .
docker push gusrochada/analyzer-service:latest

cd ../aggregator-service
docker build -t gusrochada/aggregator-service:latest .
docker push gusrochada/aggregator-service:latest

cd ..
kubectl apply -f mongo-deployment.yaml
kubectl apply -f analyzer-service.yaml
kubectl apply -f aggregator-service.yaml

kubectl apply -f nginx-config.yaml
kubectl apply -f nginx-reverse-proxy.yaml
kubectl apply -f nginx-reverse-proxy-service.yaml

echo "Starting minikube tunnel..."
minikube tunnel &

TIMEOUT=60
ELAPSED=0
INTERVAL=5

MINIKUBE_IP=$(minikube ip)
NODE_PORT=$(kubectl get svc nginx-reverse-proxy-service -o jsonpath='{.spec.ports[0].nodePort}')
SERVICE_URL="http://$MINIKUBE_IP:$NODE_PORT/sequences"

while (( ELAPSED < TIMEOUT )); do
  # Check if the service is reachable
  if curl --output /dev/null --silent --head --fail "$SERVICE_URL"; then
    echo "{\"host\": \"$MINIKUBE_IP\", \"port\": \"$NODE_PORT\"}" > service_info.json
    echo "Tunnel successfully established. Use the client by executing dna-client.py (or optionally access the API service directly at: $SERVICE_URL)"
    break
  else
    echo "Waiting for the tunnel to be available..."
    sleep $INTERVAL
    (( ELAPSED += INTERVAL ))
  fi
done

# Check if the tunnel failed to start within the timeout
if (( ELAPSED >= TIMEOUT )); then
  echo "Error: Tunnel was not established within $TIMEOUT seconds."
  echo "Please check the minikube tunnel setup and try again."
  exit 1
else
  echo "Deployment complete."
fi