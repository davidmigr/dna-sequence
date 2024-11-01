#!/bin/bash

kubectl delete -f mongo-deployment.yaml
kubectl delete -f analyzer-service.yaml
kubectl delete -f aggregator-service.yaml
kubectl delete -f nginx-reverse-proxy-service.yaml

kubectl delete pods --all
#kubectl delete services --all
kubectl delete deployments --all

echo "Cleanup complete."
